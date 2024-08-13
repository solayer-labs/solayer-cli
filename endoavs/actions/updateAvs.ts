import {
  SystemProgram,
  PublicKey,
  Keypair,
  Connection,
  Transaction,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import * as helper from "../utils/helpers";
import { PROGRAM_ID } from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param newName Define the new name of the endogenous AVS
 * @param newURL Define the new URL of the endogenous AVS
 * @param endoAvsAddress Pass in the address of the endoAVS account that was created by calling the create() method
 */
export async function updateAvs(
  providerUrl: string,
  keyPairPath: string,
  newName: string,
  newURL: string,
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

  // Adjust the compute budget so that the transaction goes through
  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_000_000,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100_000,
    })
  );

  // Call the updateEndoavs method on the endoavs program and add the instruction to the transaction
  // This changes the name and URL of the endoAVS
  const updateTx = await endoavsProgram.methods
    .updateEndoavs(newName, newURL)
    .accounts({
      authority: keypair.publicKey,
      endoAvs: endoAvsPublicKey,
      avsTokenMint: avsTokenMintPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair.payer])
    .transaction();
  tx.add(updateTx);

  // Sign and send the transaction
  await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(
    helper.log
  );

  // Fetch the updated endoAVS information and log it
  const update_endoavs_info = await endoavsProgram.account.endoAvs.fetch(
    endoAvsPublicKey
  );
  console.log(
    "new update_endoavs_info is : ",
    JSON.stringify(update_endoavs_info, null, 2)
  );
}
