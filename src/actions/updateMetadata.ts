import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "../utils/endoavs_program.json";
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "../utils/helpers";
import { METADATA_PROGRAM_ID, PDA_SEED, PROGRAM_ID } from "../utils/constants";

export async function updateMetadata(
  name: string,
  symbol: string,
  uri: string,
  avsTokenMintAddress: string
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
  const avsTokenMintPublicKey = new PublicKey(avsTokenMintAddress);
  const endo_avs = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEED), avsTokenMintPublicKey.toBuffer()],
    endoavsProgram.programId
  )[0];

  try {
    await endoavsProgram.methods
      .setAvsTokenMetadata(name, symbol, uri)
      .accounts({
        endo_avs: endo_avs,
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
      .rpc()
      .then(helper.log);
  } catch (error) {
    console.error("Error setting metadata:", error);
  }
}
