import {
  SystemProgram,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Connection,
  sendAndConfirmTransaction,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import BN from "bn.js";
import * as helper from "../utils/helpers";
import { DELEGATED_TOKEN_MINT_ID, PROGRAM_ID } from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param numberOfSOL Define the amount of sSOL that the user will delegate
 * @param endoAvsAddress Pass in the address of the endoAVS account that was created by calling the create() method
 */
export async function delegate(
  providerUrl: string,
  keyPairPath: string,
  numberOfSOL: number,
  endoAvsAddress: string
) {

  // Set up the environment for the rest of the script
  const connection = new Connection(providerUrl, "confirmed");
  const keypair = new anchor.Wallet(
    Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
    )
  );
  const provider = new anchor.AnchorProvider(connection, keypair, {});
  anchor.setProvider(provider);

  // Create the endoAVS program from its IDL file
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );
  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(
    endoAvsPublicKey
  );
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);

  try {

    // Adjust the compute budget so that the transaction goes through
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      })
    );

    // Call the delegate method on the endoavs program and add the instruction to the transaction
    const delegateTx = await endoavsProgram.methods
      .delegate(new BN(numberOfSOL * LAMPORTS_PER_SOL))
      .accounts({
        staker: keypair.publicKey,
        endoAvs: endoAvsPublicKey,
        avsTokenMint: avsTokenMintPublicKey,
        delegatedTokenVault: getAssociatedTokenAddressSync(
          DELEGATED_TOKEN_MINT_ID,
          endoAvsPublicKey,
          true
        ),
        delegatedTokenMint: DELEGATED_TOKEN_MINT_ID,
        stakerDelegatedTokenAccount: getAssociatedTokenAddressSync(
          DELEGATED_TOKEN_MINT_ID,
          keypair.publicKey,
          true
        ),
        stakerAvsTokenAccount: getAssociatedTokenAddressSync(
          avsTokenMintPublicKey,
          keypair.publicKey,
          true
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer])
      .transaction();
    tx.add(delegateTx);

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(
      helper.log
    );
  } catch (error) {
    console.error("Error delegating:", error);
  }
}

/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param numberOfSOL Define the amount of sSOL that the user will undelegate
 * @param endoAvsAddress Pass in the address of the endoAVS account that was created by calling the create() method
 */
export async function undelegate(
  providerUrl: string,
  keyPairPath: string,
  numberOfSOL: number,
  endoAvsAddress: string
) {

  // Set up the environment for the rest of the script
  const connection = new Connection(providerUrl, "confirmed");
  const keypair = new anchor.Wallet(
    Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
    )
  );
  const provider = new anchor.AnchorProvider(connection, keypair, {});
  anchor.setProvider(provider);

  // Create the endoAVS program from its IDL file
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );
  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(
    endoAvsPublicKey
  );
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);

  try {

    // Adjust the compute budget so that the transaction goes through
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      })
    );

    // Call the undelegate method on the endoavs program and add the instruction to the transaction
    const undelegateTx = await endoavsProgram.methods
      .undelegate(new BN(numberOfSOL * LAMPORTS_PER_SOL))
      .accounts({
        staker: keypair.publicKey,
        endoAvs: endoAvsPublicKey,
        avsTokenMint: avsTokenMintPublicKey,
        delegatedTokenVault: endoAvsObj.delegatedTokenVault,
        delegatedTokenMint: endoAvsObj.delegatedTokenMint,
        stakerDelegatedTokenAccount: getAssociatedTokenAddressSync(
          DELEGATED_TOKEN_MINT_ID,
          keypair.publicKey,
          true
        ),
        stakerAvsTokenAccount: getAssociatedTokenAddressSync(
          avsTokenMintPublicKey,
          keypair.publicKey,
          true
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer])
      .transaction();
    tx.add(undelegateTx);

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(
      helper.log
    );
  } catch (error) {
    console.error("Error undelegating:", error);
  }
}
