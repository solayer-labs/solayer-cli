import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { VersionedTransaction, Keypair, Connection } from "@solana/web3.js";
import { convertFromDecimalBN, loadKeypairFromFile } from "../utils/helpers";

/**
 * @param account Pass in the public key of the user that is providing the stake
 * @param amount Define the amount of native SOL (in SOL) that the user will stake
 */
async function getServerSignedTx(
    account: web3.PublicKey, 
    amount: string
) {
    return new Promise(async (resolve, reject) => {
        try {
            // Make a POST request to the Solana actions endpoint
            const response = await fetch(`https://app.solayer.org/api/action/restake/ssol?amount=${amount}`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    account: account.toString()
                })
            }) 
            const res = await response.json();
            if (!response.ok) {
                throw new Error((res as any)?.message || 'error');
            }
            resolve(res);
        } catch(e) {
            console.log('!!!!!!!!!!!Error!!!!!!!!!!!!!');
            console.log(e);
            throw new Error(e);
        }
    })
}

/**
 * @param providerUrl Pass in the RPC provider URL E.g. Helius, Alchemy ...
 * @param keyPairPath Pass in the path to your keypair .json file
 * @param amount Define the amount of native SOL (in SOL) that the user will stake
 */
export async function blink_restake(
    providerUrl: string,
    keyPairPath: string,
    amount: string
) {
    // Set up the environment to sign the transaction that is returned from the API
    const connection = new Connection(providerUrl, "confirmed");
    const keypair = new anchor.Wallet(
        Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
        )
    );
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);

    // Check if the account has enough SOL to stake the amount defined
    const decimals = 9;
    const balance = await connection.getBalance(provider.publicKey);
    if (new BN(balance).lt(convertFromDecimalBN(amount, decimals))) {
        throw Error(`Insufficient balance`);
    }

    try {
        // Use the getServerSignedTx function to construct the restaking transaction
        const data = await getServerSignedTx(provider.publicKey, amount);

        // Prepare the wallet and parse the base64 transaction returned from the API
        const wallet = loadKeypairFromFile(keyPairPath);
        const txDataBuffer  = Buffer.from(data['transaction'], 'base64');

        // Sign the transaction and send it
        let transaction = VersionedTransaction.deserialize(Uint8Array.from(txDataBuffer));
        transaction.sign([wallet]);
        
        const tx = await connection.sendRawTransaction(transaction.serialize(), {
            preflightCommitment: connection.commitment
        });

        console.log('New transaction signature:', tx);
    } catch(e) {
        console.log('!!!!!!!!!!!Error!!!!!!!!!!!!!');
        throw new Error(e);
    }
}
