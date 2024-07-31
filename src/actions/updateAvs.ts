import { SystemProgram, PublicKey, Keypair, Connection } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import * as helper from "../utils/helpers";
import { PROGRAM_ID } from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";

export async function updateAvs(
  providerUrl: string,
  keyPairPath: string,
  newName: string,
  newURL: string,
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
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );

  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(endoAvsPublicKey);
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);

  await endoavsProgram.methods
    .updateEndoavs(newName, newURL)
    .accounts({
      authority: keypair.publicKey,
      endoAvs: endoAvsPublicKey,
      avsTokenMint: avsTokenMintPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair.payer])
    .rpc()
    .then(helper.log);

  const update_endoavs_info = await endoavsProgram.account.endoAvs.fetch(
    endoAvsPublicKey
  );
  console.log(
    "new update_endoavs_info is : ",
    JSON.stringify(update_endoavs_info, null, 2)
  );
}
