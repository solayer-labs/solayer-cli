import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import * as helper from "../utils/helpers";
import { PDA_SEED, PROGRAM_ID } from "../utils/constants";

export async function updateAvs(newName: string, newURL: string, avsTokenMintAddress: string) {
  anchor.setProvider(anchor.AnchorProvider.env());
  const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
  const endoavsProgram = new anchor.Program(
    endoavsProgramIDL as anchor.Idl,
    PROGRAM_ID
  );
  const avsTokenMintPublicKey = new PublicKey(avsTokenMintAddress);
  const endoavs = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEED), avsTokenMintPublicKey.toBuffer()],
    endoavsProgram.programId
  )[0];

  await endoavsProgram.methods
    .updateEndoavs(newName, newURL)
    .accounts({
      authority: keypair.publicKey,
      endoAvs: endoavs,
      avsTokenMint: avsTokenMintPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair.payer])
    .rpc()
    .then(helper.log);

  const update_endoavs_info = await endoavsProgram.account.endoAvs.fetch(
    endoavs
  );
  console.log(
    "new update_endoavs_info is : ",
    JSON.stringify(update_endoavs_info, null, 2)
  );
}
