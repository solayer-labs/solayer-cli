import { SystemProgram, PublicKey, Keypair, Connection } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "../utils/helpers";
import {
  DELEGATED_TOKEN_MINT_ID,
  METADATA_PROGRAM_ID,
  PDA_SEED,
  PROGRAM_ID,
} from "../utils/constants";
import { readFileSync } from "fs";

export async function createAvs(
  providerUrl: string,
  keyPairPath: string,
  avsName: string,
  avsTokenMintKeyPairPath: string
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
  const avsTokenMint = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(avsTokenMintKeyPairPath).toString()))
  );
  const endoavs = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEED), avsTokenMint.publicKey.toBuffer()],
    endoavsProgram.programId
  )[0];
  console.log("Endoavs address: " + endoavs);
  console.log("Endoavs program: " + PROGRAM_ID.toString());
  console.log("AvsTokenMint: " + avsTokenMint.toString());
  // TODO: EndoAVS Program not deployed - 61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi failed: invalid account data for instruction

  try {
    await endoavsProgram.methods
      .create(avsName)
      .accounts({
        endoAvs: endoavs,
        authority: keypair.publicKey,
        avsTokenMint: avsTokenMint.publicKey,
        avsTokenMetadata: metaplex
          .nfts()
          .pdas()
          .metadata({ mint: avsTokenMint.publicKey }),
        delegatedTokenVault: getAssociatedTokenAddressSync(
          DELEGATED_TOKEN_MINT_ID,
          endoavs,
          true
        ),
        delegatedTokenMint: DELEGATED_TOKEN_MINT_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer, avsTokenMint])
      .rpc()
      .then(helper.log);
  } catch (error) {
    console.error("Error creating endogenous AVS:", error);
  }
}
