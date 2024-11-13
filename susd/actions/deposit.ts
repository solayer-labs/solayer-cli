import {
  SystemProgram,
  PublicKey,
  Keypair,
  Connection,
  sendAndConfirmTransaction,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import susdPoolProgramIDL from "../utils/susd_pool.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import * as helper from "../utils/helpers";
import { USDC_MINT, SUSD_POOL, SUSD_MINT } from "../utils/constants";
import { readFileSync } from "fs";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param usdcDepoAmt Pass in the amount of USDC that is being deposited
 */
export async function deposit(
  providerUrl: string,
  keyPairPath: string,
  usdcDepoAmt: number,
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

  // Create the sUSD pool program from its IDL file
  const susdProgram = new anchor.Program(
    susdPoolProgramIDL as anchor.Idl,
    SUSD_POOL,
    provider
  );

  const nonce = new anchor.BN(Math.random() * 100_000_000);

  const [pool] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("pool"),
        USDC_MINT.toBuffer(),
        SUSD_MINT.toBuffer(),
    ],
    susdProgram.programId
  );

  const signerUsdcTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      keypair.publicKey,
      true
  );

  const poolUsdcMainVault = getAssociatedTokenAddressSync(
      USDC_MINT,
      pool,
      true
  );

  const signerSusdVault = getAssociatedTokenAddressSync(
      SUSD_MINT,
      keypair.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID
  );

  const [depositProof] = PublicKey.findProgramAddressSync(
      [
          Buffer.from("deposit_proof"),
          pool.toBuffer(),
          keypair.publicKey.toBuffer(),
          nonce.toArrayLike(Buffer, "be", 8),
      ],
      susdProgram.programId
  );
  
    // Adjust the compute budget so that the transaction goes through
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 200_000,
      })
    );

    const depositInst = await susdProgram.methods
        .deposit(nonce, new anchor.BN(usdcDepoAmt * 10 ** 6))
        .accounts({
            signer: keypair.publicKey,
            usdcMint: USDC_MINT,
            signerUsdcTokenAccount,
            poolUsdcMainVault,
            susdMint: SUSD_MINT,
            signerSusdVault,
            pool,
            depositProof,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
    })
    // .signers([keypair.payer]).transaction();
    .instruction();
  
    tx.add(depositInst);
    try {
        await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(helper.log);
    } catch (error) {
        console.error(error);
    }

    console.log(
      `User %s deposits %d USDC with proof as %s. Susd vault is %s`,
      keypair.publicKey,
      usdcDepoAmt,
      depositProof.toBase58(),
      signerSusdVault.toBase58()
    );
}
  