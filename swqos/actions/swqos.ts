import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { VersionedTransaction, Keypair, Connection } from "@solana/web3.js";
import { convertFromDecimalBN, loadKeypairFromFile } from "../utils/helpers";
import axios from "axios";

/**
 * @param account Pass in the public key of the user that is providing the stake
 * @param amount Define the amount of native SOL (in SOL) that the user will stake
 * @param referrerKey Pass in the address of your (partner) wallet that the referral will be tracked to
 */
async function getServerTx(
    account: web3.PublicKey, 
    amount: string, 
    referrerKey: string
) {
    return new Promise(async (resolve, reject) => {
        try {
            // Define URL parameters for the API call
            const params = new URLSearchParams({
                staker: account.toString(),
                amount: amount,
                referrerkey: referrerKey
            });

            // Make a GET request to the partner API endpoint with the params defined above
            const response = await fetch(`https://app.solayer.org/api/partner/restake/ssol?${params}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
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
 * @param referrer Pass in the address of your (partner) wallet that the referral will be tracked to
 */
export async function swqos(
    providerUrl: string,
    keyPairPath: string,
    amount: string,
    referrer: string
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
        // Use the getServerTx function to construct the restaking transaction
        const data = await getServerTx(provider.publicKey, amount, referrer);
        console.log(data);

        // Prepare the wallet and parse the base64 transaction returned from the API
        const wallet = loadKeypairFromFile(keyPairPath);
        const txDataBuffer  = Buffer.from(data['transaction'], 'base64');
        console.log('txDataBuffer', txDataBuffer);

        // Sign the transaction and send it
        let transaction = VersionedTransaction.deserialize(Uint8Array.from(txDataBuffer));
        transaction.sign([wallet]);
        
        console.log('fullySignedTransaction ', transaction.message);

        const tx = await connection.sendRawTransaction(transaction.serialize(), {
            preflightCommitment: connection.commitment
        });

        const body = {
            jsonrpc: "2.0",
            method: "sendTransaction",
            id: 1,
            params: [
                tx
            ],
          };
          try {
            const response = await axios.post(`https://acc.solayer.org`, body);
            console.log(response.data);
          } catch (error) {
            console.log(error.response.data);
          }

        console.log('New accelerated transaction signature:', tx);
    } catch(e) {
        console.log('!!!!!!!!!!!Error!!!!!!!!!!!!!');
        throw new Error(e);
    }
}
