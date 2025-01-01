import * as anchor from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { VersionedTransaction, Keypair, Connection } from "@solana/web3.js";
import { convertFromDecimalBN, loadKeypairFromFile } from "../utils/helpers";
import axios from "axios";

interface PreparedTransaction {
    transaction: VersionedTransaction | null;
    index: number;
    error: string | null;
}

interface SentTransactionSuccess {
    type: 'success';
    signature: string;
    index: number;
    timestamp: number;
}

interface SentTransactionFailure {
    type: 'failure';
    signature: string;
    index: number;
    timestamp: number;
    error: string;
}

type SentTransaction = SentTransactionSuccess | SentTransactionFailure;

interface TransactionResult {
    signature: string;
    status: 'success' | 'failed';
    error?: string;
    timestamp: number;
    index: number;
}

interface BenchmarkResult {
    endpoint: string;
    transactions: TransactionResult[];
}

async function getServerTx(
    account: web3.PublicKey, 
    amount: string, 
    referrerKey: string
): Promise<any> {
    const params = {
        staker: account.toString(),
        amount: amount,
        referrerkey: referrerKey
    };

    try {
        const response = await axios.get('https://app.solayer.org/api/partner/restake/ssol', {
            params,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.message || 'Server error');
        }
        throw error;
    }
}

async function sendTransaction(
    connection: Connection,
    transaction: VersionedTransaction,
    accelerated: boolean
): Promise<string> {
    const serializedTx = transaction.serialize();
    const signature = await connection.sendRawTransaction(serializedTx, {
        preflightCommitment: connection.commitment,
        maxRetries: 3
    });

    if (accelerated) {
        const encodedTx = Buffer.from(serializedTx).toString('base64');
        const body = {
            jsonrpc: "2.0",
            method: "sendTransaction",
            id: 1,
            params: [encodedTx],
        };
        
        try {
            await axios.post('https://acc.solayer.org', body);
        } catch (error) {
            console.error('Acceleration request failed:', error.response?.data || error.message);
        }
    }

    return signature;
}

async function waitForConfirmation(
    connection: Connection,
    signature: string,
    maxAttempts: number = 5
): Promise<{ success: boolean; error?: string }> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await connection.getSignatureStatus(signature);
            
            if (!response || !response.value) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            const status = response.value;
            
            if (status.err) {
                const errorStr = JSON.stringify(status.err);
                if (errorStr.includes("BlockhashNotFound") || errorStr.includes("Blockhash not found")) {
                    return { success: false, error: "Blockhash expired" };
                }
                return { success: false, error: JSON.stringify(status.err) };
            }

            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                return { success: true };
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return { success: false, error: "Transaction not confirmed after multiple attempts" };
}

async function runBenchmark(
    providerUrl: string,
    keyPairPath: string,
    amount: string,
    referrer: string,
    numTransactions: number = 10
): Promise<BenchmarkResult[]> {
    const connection = new Connection(providerUrl, "confirmed");
    const keypair = new anchor.Wallet(
        Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(readFileSync(keyPairPath).toString()))
        )
    );
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);

    // Check balance
    const decimals = 9;
    const balance = await connection.getBalance(provider.publicKey);
    const requiredBalance = convertFromDecimalBN(amount, decimals).mul(new BN(numTransactions * 2));
    if (new BN(balance).lt(requiredBalance)) {
        throw Error(`Insufficient balance for benchmark`);
    }

    const results: BenchmarkResult[] = [
        { endpoint: "Accelerated", transactions: [] },
        { endpoint: "Standard", transactions: [] }
    ];

    const wallet = loadKeypairFromFile(keyPairPath);
    const usedTransactions = new Set<string>();
    
    console.log(`\nStarting benchmark with ${numTransactions} transactions per endpoint...`);
    console.log('===============================================');

    // Run transactions for both accelerated and standard endpoints
    for (let useAcceleration of [true, false]) {
        const resultIndex = useAcceleration ? 0 : 1;
        console.log(`\nTesting ${results[resultIndex].endpoint} transactions:`);
        
        // First, prepare all transactions in parallel
        console.log('Preparing transactions...');
        const preparedTransactions = await Promise.all(
            Array(numTransactions).fill(0).map(async (_, i): Promise<PreparedTransaction> => {
                try {
                    // Generate a random amount between 95-99.9% of the specified amount
                    // Otherwise, the transaction constructed will be the same (cached) and will have to retry
                    const baseAmount = parseFloat(amount);
                    const randomFactor = 0.95 + (Math.random() * 0.049); // 0.95 to 0.999
                    const randomAmount = (baseAmount * randomFactor).toFixed(9); // Use 9 decimals for SOL
                    
                    const data = await getServerTx(provider.publicKey, randomAmount, referrer);
                    const txDataBuffer = Buffer.from(data['transaction'], 'base64');
                    let transaction = VersionedTransaction.deserialize(Uint8Array.from(txDataBuffer));
                    transaction.sign([wallet]);
                    
                    console.log(`Transaction ${i + 1}: Amount = ${randomAmount} SOL (${(randomFactor * 100).toFixed(2)}% of ${baseAmount} SOL)`);
                    
                    return { transaction, index: i, error: null };
                } catch (error) {
                    return { transaction: null, index: i, error: error.message };
                }
            })
        );
        
        // Then, send all transactions in parallel
        console.log('Sending transactions in parallel...');
        const sentTransactions = await Promise.all(
            preparedTransactions.map(async ({ transaction, index, error }): Promise<SentTransaction> => {
                if (error || !transaction) {
                    console.error(`Error preparing transaction ${index + 1}:`, error);
                    return {
                        type: 'failure',
                        signature: 'N/A',
                        error: error || 'Unknown error',
                        timestamp: Date.now(),
                        index
                    };
                }

                try {
                    const signature = await sendTransaction(connection, transaction, useAcceleration);
                    console.log(`${index + 1}/${numTransactions}: Transaction ${signature} sent`);
                    return {
                        type: 'success',
                        signature,
                        timestamp: Date.now(),
                        index
                    };
                } catch (error) {
                    console.error(`Error sending transaction ${index + 1}:`, error.message);
                    return {
                        type: 'failure',
                        signature: 'N/A',
                        error: error.message,
                        timestamp: Date.now(),
                        index
                    };
                }
            })
        );

        // Finally, track confirmations in parallel
        console.log('\nTracking confirmations...');
        const confirmedTransactions = await Promise.all(
            sentTransactions.map(async (tx): Promise<TransactionResult> => {
                if (tx.type === 'failure') {
                    return {
                        signature: tx.signature,
                        status: 'failed',
                        error: tx.error,
                        timestamp: tx.timestamp,
                        index: tx.index
                    };
                }

                try {
                    const confirmResult = await waitForConfirmation(connection, tx.signature);
                    
                    if (confirmResult.success) {
                        console.log(`✅ Transaction ${tx.signature} confirmed`);
                    } else {
                        console.log(`❌ Transaction ${tx.signature} failed: ${confirmResult.error}`);
                    }

                    return {
                        signature: tx.signature,
                        timestamp: tx.timestamp,
                        index: tx.index,
                        status: confirmResult.success ? 'success' : 'failed',
                        error: confirmResult.error
                    };
                } catch (error) {
                    console.error(`Error confirming transaction ${tx.signature}:`, error.message);
                    return {
                        signature: tx.signature,
                        timestamp: tx.timestamp,
                        index: tx.index,
                        status: 'failed',
                        error: error.message
                    };
                }
            })
        );
        
        // Sort by index before adding to results to maintain order
        results[resultIndex].transactions = confirmedTransactions.sort((a, b) => a.index - b.index);
    }

    return results;
}

export async function benchmark(
    providerUrl: string,
    keyPairPath: string,
    amount: string,
    referrer: string,
    numTransactions: number = 10
) {
    try {
        const results = await runBenchmark(providerUrl, keyPairPath, amount, referrer, numTransactions);
        
        console.log('\nBenchmark Results:');
        console.log('==================');
        
        results.forEach(result => {
            const total = result.transactions.length;
            const successCount = result.transactions.filter(tx => tx.status === 'success').length;
            const successRate = (successCount / total * 100).toFixed(2);
            
            console.log(`\n${result.endpoint} Results:`);
            console.log(`Success Rate: ${successRate}%`);
            console.log(`Successful Transactions: ${successCount}/${total}`);
            
            // Group errors
            const errors = result.transactions
                .filter(tx => tx.error)
                .reduce((acc, tx) => {
                    acc[tx.error!] = (acc[tx.error!] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
            
            if (Object.keys(errors).length > 0) {
                console.log('\nError Distribution:');
                Object.entries(errors).forEach(([error, count]) => {
                    console.log(`- ${error}: ${count} occurrences`);
                });
            }

            // Detailed transaction list
            console.log('\nDetailed Transactions:');
            result.transactions.forEach(tx => {
                const status = tx.status === 'success' ? '✅' : '❌';
                console.log(`${status} ${tx.signature}`);
                if (tx.error) {
                    console.log(`   Error: ${tx.error}`);
                }
            });
        });

        const acceleratedSuccessRate = (results[0].transactions.filter(tx => tx.status === 'success').length / numTransactions * 100).toFixed(2);
        const standardSuccessRate = (results[1].transactions.filter(tx => tx.status === 'success').length / numTransactions * 100).toFixed(2);
        const improvement = (parseFloat(acceleratedSuccessRate) - parseFloat(standardSuccessRate)).toFixed(2);

        console.log('\nComparison:');
        console.log(`Improvement with acceleration: ${improvement}%`);

    } catch (error) {
        console.error('Benchmark failed:', error.message);
    }
}
