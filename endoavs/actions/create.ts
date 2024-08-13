import { SystemProgram, PublicKey, Keypair, Connection, Transaction, ComputeBudgetProgram, sendAndConfirmTransaction } from "@solana/web3.js";
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
  ENDOAVS_FEE_ADDRESS,
} from "../utils/constants";
import { readFileSync } from "fs";

/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param avsName Define the name of your AVS
 * @param avsTokenMintKeyPairPath Pass in the path to the keypair .json file that will be used to create your AVS token mint
 */
export async function createAvs(
  providerUrl: string,
  keyPairPath: string,
  avsName: string,
  avsTokenMintKeyPairPath: string
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

  // Create the AVS Token Mint that will be used when we create the endoAVS
  // NOTE: The keypair will be controlled by the mint program after initialization. Knowing the private key has no additional privilege.
  const avsTokenMint = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(avsTokenMintKeyPairPath).toString()))
  );
  const endoavs = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEED), avsTokenMint.publicKey.toBuffer()],
    endoavsProgram.programId
  )[0];

  // Adjust the compute budget so that the transaction goes through
  try {
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      }),
    );

    // Create the transaction that calls the create() method on the endoAVS program
    const createTx = await endoavsProgram.methods
      .create(avsName)
      .accounts({
        endoAvs:          endoavs,
        authority:        keypair.publicKey,
        createFeeRecipient: ENDOAVS_FEE_ADDRESS,
        avsTokenMint:     avsTokenMint.publicKey,
        avsTokenMetadata: metaplex
          .nfts()
          .pdas()
          .metadata({ mint: avsTokenMint.publicKey }),
        delegatedTokenVault: getAssociatedTokenAddressSync(
          DELEGATED_TOKEN_MINT_ID,
          endoavs,
          true
        ),
        delegatedTokenMint:     DELEGATED_TOKEN_MINT_ID,
        tokenProgram:           TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram:   METADATA_PROGRAM_ID,
        systemProgram:          SystemProgram.programId,
        rent:                   anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([keypair.payer, avsTokenMint])
      .transaction();

      // Construct the transaction and send it
      tx.add(createTx);
      await sendAndConfirmTransaction(connection, tx, [keypair.payer, avsTokenMint], {}).then(helper.log);
    console.log("Endogenous AVS created successfully with address: ", endoavs.toString());
  } catch (error) {
    console.error("Error creating endogenous AVS:", error);
  }
}
