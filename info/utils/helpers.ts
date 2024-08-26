import * as anchor from "@project-serum/anchor";
import * as fs from "fs";

export function convertFromDecimalBN(amount: string | number, decimals: number) {
    const [integerPart, fractionalPart = ''] = amount.toString().split('.');
    const paddedFractionalPart = fractionalPart.padEnd(decimals, '0');
    return new anchor.BN(integerPart + paddedFractionalPart);
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
