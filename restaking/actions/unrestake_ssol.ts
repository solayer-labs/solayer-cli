import restakingProgramIDL from "../utils/restaking_program.json";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createApproveInstruction } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey, Keypair, Connection, StakeProgram } from "@solana/web3.js";
import { readFileSync } from "fs";
import { StakePoolInstruction } from "@solana/spl-stake-pool";
import { convertFromDecimalBN, loadKeypairFromFile } from "../utils/helpers";
import { 
    RESTAKING_PROGRAM_ID, 
    STAKE_POOL_MINT, 
    SOLAYER_ADMIN_SIGNER, 
    POOL_ADDRESS, 
    SSOL_MINT 
} from "../utils/constants";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param amount Define the amount of native SOL (in SOL) that the user will unstake
 */
export async function unrestake(
    providerUrl: string,
    keyPairPath: string,
    amount: string
) {
    // Set up the environment for the rest of the script
    const connection = new Connection(providerUrl, "confirmed");
    const signer = loadKeypairFromFile(keyPairPath);
    const keypair = new anchor.Wallet(
        Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
        )
    );
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);

    // Adjust the compute budget so that the transaction goes through
    let tx = new anchor.web3.Transaction();
    tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 500000
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 200000,
        }),
    )

    // Create the restaking program from its IDL file
    // RESTAKING_PROGRAM_ID: sSo1iU21jBrU9VaJ8PJib1MtorefUV4fzC9GURa2KNn
    const restakeProgram = new anchor.Program(
        restakingProgramIDL as anchor.Idl, 
        RESTAKING_PROGRAM_ID
    );

    // Define the accounts and derive the associated token account (ATA) addresses to call the unrestake method
    // POOL_ADDRESS:    3sk58CzpitB9jsnVzZWwqeCn2zcXVherhALBh88Uw9GQ
    // SSOL_MINT:       sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh
    // STAKE_POOL_MINT: sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4
    const pool = POOL_ADDRESS;
    const lstVault = getAssociatedTokenAddressSync(STAKE_POOL_MINT, pool, true);
    const rstMint = SSOL_MINT;
    const rstAta = getAssociatedTokenAddressSync(rstMint, provider.publicKey, true);
    const lstAta = getAssociatedTokenAddressSync(STAKE_POOL_MINT, provider.publicKey);

    // Call the unrestake method on the restaking program
    let unrestakeInstruction = await restakeProgram.methods
        .unrestake(convertFromDecimalBN(amount, 9))
        .accounts({
            signer:                 keypair.publicKey,
            lstMint:                STAKE_POOL_MINT,
            rstMint:                rstMint,
            solayerSigner:          SOLAYER_ADMIN_SIGNER,
            pool,
            vault:                  lstVault,
            lstAta:                 lstAta,
            rstAta:                 rstAta,
            tokenProgram:           TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram:          web3.SystemProgram.programId
        })
        .instruction();
    tx.add(unrestakeInstruction);

    // Create an Approve instruction to access the LST’s associated token account to execute 
    // subsequent operations to unstake the native SOL from our stake pool subsequent instructions
    let feePayerPublicKey = provider.publicKey;
    let approveInstruction = createApproveInstruction(
        lstAta,
        feePayerPublicKey,
        feePayerPublicKey,
        convertFromDecimalBN(amount, 9).toNumber(),
    )
    tx.add(approveInstruction);

    let stakeAccount = web3.Keypair.generate();
    // let lamportsForStakeAccount =
    //     (await connection.getMinimumBalanceForRentExemption(
    //         web3.StakeProgram.space,
    //     )) + 50;
    let lamportsForStakeAccount = 2282880;

    // Create a stake account to receive the user’s stake that is being withdrawn from our stake pool.
    let createAccountTransaction = web3.SystemProgram.createAccount({
        /** The account that will transfer lamports to the created account */
        fromPubkey: feePayerPublicKey,
        /** Public key of the created account */
        newAccountPubkey: stakeAccount.publicKey,
        /** Amount of lamports to transfer to the created account */
        lamports: lamportsForStakeAccount,
        /** Amount of space in bytes to allocate to the created account */
        space: StakeProgram.space,
        /** Public key of the program to assign as the owner of the created account */
        programId: StakeProgram.programId,
    });
    tx.add(createAccountTransaction);

    // Create the withdrawStake instruction to split and withdraw stake from the stake pool
    const withdrawStakeInstruction = StakePoolInstruction.withdrawStake({
        stakePool:          new PublicKey('po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2'),
        validatorList:      new PublicKey('nk5E1Gc2rCuU2MDTRqdcQdiMfV9KnZ6JHykA1cTJQ56'),
        withdrawAuthority:  new PublicKey('H5rmot8ejBUWzMPt6E44h27xj5obbSz3jVuK4AsJpHmv'),
        validatorStake:     new PublicKey('CpWqBteUJodiTcGYWsxq4WTaBPoZJyKkBbkWwAMXSyTK'),
        destinationStake:           stakeAccount.publicKey,
        destinationStakeAuthority:  feePayerPublicKey,
        sourceTransferAuthority:    feePayerPublicKey,
        sourcePoolAccount:          lstAta,
        managerFeeAccount:          new PublicKey('ARs3HTD79nsaUdDKqfGhgbNMVJkXVdRs2EpHAm4LNEcq'),
        poolMint:           STAKE_POOL_MINT, 
        poolTokens:         convertFromDecimalBN(amount, 9).toNumber(),
    });
    tx.add(withdrawStakeInstruction);

    // Add a deactivate instruction to deactivate the stake account so the user can withdraw their deposit
    let deactivateInstruction = StakeProgram.deactivate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: feePayerPublicKey
    });
    tx.add(deactivateInstruction);

    // Send and confirm transaction
    tx.feePayer = feePayerPublicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signature = await web3.sendAndConfirmTransaction(
        connection,
        tx,
        [
            signer,
            stakeAccount,
        ]
    );
    console.log(signature);
}
