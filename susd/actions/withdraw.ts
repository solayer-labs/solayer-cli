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
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import * as helper from "../utils/helpers";
import { USDC_MINT, SUSD_POOL, SUSD_MINT } from "../utils/constants";
import { readFileSync } from "fs";


/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param usdcAmt Pass in the amount of sUSD that is being withdrawn
 */
export async function withdraw(
  providerUrl: string,
  keyPairPath: string,
  usdcAmt: number,
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
    SUSD_POOL
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

  const signerSusdVault = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair.payer,
    SUSD_MINT,
    keypair.publicKey,
    true,
    "confirmed",
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  const poolSusdVault = getAssociatedTokenAddressSync(
    SUSD_MINT,
    pool,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const [withdrawProof] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("withdraw_proof"),
      pool.toBuffer(),
      keypair.publicKey.toBuffer(),
      nonce.toArrayLike(Buffer, "be", 8),
    ],
    susdProgram.programId
  );

  const signerUsdcTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    keypair.publicKey,
    true
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

  const withdrawInst = await susdProgram.methods
  .withdraw(nonce, new anchor.BN(usdcAmt * 10 ** 6))
  .accounts({
    signer: keypair.publicKey,
    usdcMint: USDC_MINT,
    signerUsdcTokenAccount,
    susdMint: SUSD_MINT,
    signerSusdVault: signerSusdVault.address,
    poolSusdVault,
    pool,
    withdrawProof,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenProgram2022: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .instruction();
  
  tx.add(withdrawInst);
  try {
      await sendAndConfirmTransaction(connection, tx, [keypair.payer], {}).then(helper.log);
  } catch (error) {
      console.error(error);
  }

  console.log(
    `User %s withdraws %d USDC with proof as %s. Susd vault is %s`,
    keypair.publicKey,
    usdcAmt,
    withdrawProof.toBase58(),
    signerSusdVault.address.toBase58()
  );
}
  