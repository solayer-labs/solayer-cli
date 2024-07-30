import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";

export async function airdropSol(publicKey: anchor.web3.PublicKey, amount: number) {
    let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdropTx);
}

export function loadKeypairFromFile(filepath: string): anchor.web3.Keypair {
    try {
        // Read the JSON keypair file
        const keypairFile = fs.readFileSync(filepath, "utf-8");
        const keypairData = JSON.parse(keypairFile);

        // Convert the keypair data to a Uint8Array
        const secretKey = Uint8Array.from(keypairData);

        // Create a Keypair object from the secret key
        const keypair = anchor.web3.Keypair.fromSecretKey(secretKey);

        return keypair;
    } catch (error) {
        console.error("Error loading keypair:", error);
        throw error;
    }
}

export async function confirmTransaction(tx: any) {
    const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
    await anchor.getProvider().connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: tx,
    });
    console.log(`Transaction confirmed at: ${tx}`);
}


export async function log (signature: string): Promise<string> {
    console.log(
        `Your transaction details:
        - https://solscan.io/tx/${signature}?cluster=devnet
        - https://solana.fm/tx/${signature}?cluster=devnet`
    );
    return signature;
}