import {
  SystemProgram,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Connection,
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
import {
  DELEGATED_TOKEN_MINT_ID,
  PDA_SEED,
  PROGRAM_ID,
} from "../utils/constants";
import { readFileSync } from "fs";
import { EndoAvs } from "../utils/type";

export async function delegate(
  providerUrl: string,
  keyPairPath: string,
  numberOfSOL: number,
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
  const endoAvsTemp = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), new PublicKey("4UdVtkunKzomXwP9sRe7pz9juZLwYtiJqE6Do1coVEWN").toBuffer()], endoavsProgram.programId)[0]
  console.log("EndoAvsTemp: " + endoAvsTemp.toString());
  const endoAvsPublicKey = new PublicKey(endoAvsAddress);
  console.log("endoavsPublicKey: " + endoAvsPublicKey.toString());

  const temp = await endoavsProgram.account.endoAvs;
  const endoavsInfo = await endoavsProgram.account.endoAvs.fetch(endoAvsPublicKey);
  console.log("fetched endoavsProgram: ");
  console.log(endoavsInfo);
  const endoAvsObj = JSON.parse(JSON.stringify(endoavsInfo)) as EndoAvs;
  console.log(endoAvsObj);
  const avsTokenMintPublicKey = new PublicKey(endoAvsObj.avsTokenMint);
  console.log("Start delegate");

  try {
    await endoavsProgram.methods
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
      .rpc()
      .then(helper.log);
  } catch (error) {
    console.error("Error delegating:", error);
  }
}

export async function undelegate(
  providerUrl: string,
  keyPairPath: string,
  numberOfSOL: number,
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

  try {
    await endoavsProgram.methods
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
      .rpc()
      .then(helper.log);
  } catch (error) {
    console.error("Error undelegating:", error);
  }
}
