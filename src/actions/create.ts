import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
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
  avsName: string,
  avsTokenMintKeyPairPath: string
) {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
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

  try {
    await endoavsProgram.methods
      .create(avsName)
      .accounts({
        endoAvs: endoavs,
        authority: ASSOCIATED_TOKEN_PROGRAM_ID,
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
