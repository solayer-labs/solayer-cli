import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { VersionedTransaction, Keypair, Connection } from "@solana/web3.js";
import { convertFromDecimalBN, loadKeypairFromFile } from "../utils/helpers";

async function getServerSignedTx(account: web3.PublicKey, amount: string) {
    return new Promise(async (resolve, reject) => {
        try {
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
 * @param amount
 * 
 */
export async function restake(
    providerUrl: string,
    keyPairPath: string,
    amount: string
) {
    const connection = new Connection(providerUrl, "confirmed");
    const keypair = new anchor.Wallet(
        Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
        )
    );
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);

    const decimals = 9;

    const balance = await connection.getBalance(provider.publicKey);

    if (new BN(balance).lt(convertFromDecimalBN(amount, decimals))) {
        throw Error(`Insufficient balance`);
    }
    try {
        const data = await getServerSignedTx(provider.publicKey, amount);
        console.log(data);

        const wallet = loadKeypairFromFile(keyPairPath);
        const txDataBuffer  = Buffer.from(data['transaction'], 'base64');
        console.log('txDataBuffer', txDataBuffer);

        let transaction = VersionedTransaction.deserialize(Uint8Array.from(txDataBuffer));
        transaction.sign([wallet]);
        
        console.log('fullySignedTransaction ', transaction.message);
        const tx = await connection.sendRawTransaction(transaction.serialize(), {
            preflightCommitment: connection.commitment
        });
        console.log('New transaction signature:', tx);
    } catch(e) {
        console.log('!!!!!!!!!!!Error!!!!!!!!!!!!!');
        throw new Error(e);
    }
}
