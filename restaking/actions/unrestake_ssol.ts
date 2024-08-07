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
 * @param tokenAddress Pass in a token address for unretake
 * @param amount Number of restakes decimals is 9
 */
export async function unrestake(
    providerUrl: string,
    keyPairPath: string,
    amount: string
) {
    const connection = new Connection(providerUrl, "confirmed");
    const signer = loadKeypairFromFile(keyPairPath);
    const keypair = new anchor.Wallet(
        Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
        )
    );
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);

    let tx = new anchor.web3.Transaction();
    tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 500000
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 200000,
        }),
    )

    const restakeProgram = new anchor.Program(
        restakingProgramIDL as anchor.Idl, 
        RESTAKING_PROGRAM_ID
    );

    const pool = POOL_ADDRESS;
    const lstVault = getAssociatedTokenAddressSync(STAKE_POOL_MINT, pool, true);
    const rstMint = SSOL_MINT;
    const rstAta = getAssociatedTokenAddressSync(rstMint, provider.publicKey, true);
    const lstAta = getAssociatedTokenAddressSync(STAKE_POOL_MINT, provider.publicKey);

    let unrestakeInstruction = await restakeProgram.methods.unrestake(convertFromDecimalBN(amount, 9)).accounts({
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
    }).instruction();
    tx.add(unrestakeInstruction);

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
