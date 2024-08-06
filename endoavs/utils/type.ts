import { PublicKey } from "@solana/web3.js";

export type EndoAvs = {
  bump: number;
  authority: PublicKey;
  avsTokenMint: PublicKey;
  delegatedTokenMint: PublicKey;
  delegatedTokenVault: PublicKey;
  name: string;
  url: string;
};
