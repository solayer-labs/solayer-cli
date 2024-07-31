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

export async function transferAuthority(
  providerUrl: string,
  keyPairPath: string,
  newAuthorityAddr: string,
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
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(
    endoAvsPublicKey
  );
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);

  try {
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      })
    );

    // This will fail unless the signer is the authority holder
    const newAuthority = new PublicKey(newAuthorityAddr);
    const transferTx = await endoavsProgram.methods
      .transferAuthority()
      .accounts({
        authority: keypair.publicKey,
        endoAvs: endoAvsPublicKey,
        newAuthority: newAuthority,
        avsTokenMint: avsTokenMintPublicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer])
      .transaction();

    tx.add(transferTx);
    await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(
      helper.log
    );
  } catch (error) {
    console.error("Error transfering authority:", error);
  }
}
