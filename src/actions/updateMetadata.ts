import { Transaction, ComputeBudgetProgram, SystemProgram, PublicKey, Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "../utils/helpers";
import { METADATA_PROGRAM_ID, PROGRAM_ID } from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";

export async function updateMetadata(
  providerUrl: string,
  keyPairPath: string,
  name: string,
  symbol: string,
  uri: string,
  endoAvsAddress: string
) {
  const connection = new Connection(providerUrl, "confirmed");
  const keypair = new anchor.Wallet(
    Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
    )
  );
  const provider = new anchor.AnchorProvider(connection, keypair, {});
  anchor.setProvider(provider);
  const metaplex = new Metaplex(connection);
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );

  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(endoAvsPublicKey);
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);


  console.log("provider url", providerUrl);

  try {
    const tx = new Transaction;
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({ 
        units: 1000000 
      }),      
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 160000,
      }),      
    );
    
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
    console.log("sig:", tx.signature)
    
    await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(helper.log);
  } catch (error) {
    console.error("Error setting metadata:", error);
  }
}
