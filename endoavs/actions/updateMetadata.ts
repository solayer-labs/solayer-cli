import { Transaction, ComputeBudgetProgram, SystemProgram, PublicKey, Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "../utils/helpers";
import { METADATA_PROGRAM_ID, PROGRAM_ID } from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param name Define the name of the AVS token
 * @param symbol Define the symbol of the AVS token
 * @param uri Define the URI of the token metadata
 * @param endoAvsAddress Pass in the address of the endoAVS account that was created by calling the create() method
 */
export async function updateMetadata(
  providerUrl: string,
  keyPairPath: string,
  name: string,
  symbol: string,
  uri: string,
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
  const metaplex = new Metaplex(connection);

  // Create the endoAVS program from its IDL file
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );

  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(endoAvsPublicKey);
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);

  try {

    // Adjust the compute budget so that the transaction goes through
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      }),
    );

    // Call the updateTokenMetadata method on the endoavs program and add the instruction to the transaction
    const updateTx = await endoavsProgram.methods
      .updateTokenMetadata(name, symbol, uri)
      .accounts({
        endoAvs: endoAvsPublicKey,
        authority: keypair.publicKey,
        avsTokenMint: avsTokenMintPublicKey,
        avsTokenMetadata: metaplex
          .nfts()
          .pdas()
          .metadata({ mint: avsTokenMintPublicKey }),
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer])
      .transaction();
    tx.add(updateTx);

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(helper.log);
  } catch (error) {
    console.error("Error setting metadata:", error);
  }
}
