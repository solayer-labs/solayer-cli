import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { RESTAKING_PROGRAM_ID, LST_WITH_NO_METADATA } from "../utils/constants";
import { Metaplex } from "@metaplex-foundation/js";
import * as borsh from "@coral-xyz/borsh";


interface RestakingPoolData {
    lstMint: PublicKey;
    rstMint: PublicKey;
    bump: number;
}

const RestakingPoolSchema = borsh.struct([
    borsh.publicKey('lstMint'),
    borsh.publicKey('rstMint'),
    borsh.u8('bump'),
]);

export async function getRestakingPoolMints(
    providerUrl: string
) {
    const connection = new Connection(providerUrl, "confirmed");
    const keypair = new anchor.Wallet(Keypair.generate());
    const provider = new anchor.AnchorProvider(connection, keypair, {});
    anchor.setProvider(provider);
    const metaplex = new Metaplex(connection);

    try {
        // Get all program accounts
        const accounts = await connection.getProgramAccounts(RESTAKING_PROGRAM_ID);
        const poolMintsData = accounts.map(async (account) => {
            const poolData: RestakingPoolData = RestakingPoolSchema.decode(account.account.data.slice(8));
            const lstMint = poolData.lstMint;
            const rstMint = poolData.rstMint;
            const bump = poolData.bump;

            // Fetch LST mint metadata
            // Some LSTs like bSOL do not have metadata
            let lstName = "Unknown";
            let lstSymbol = "Unknown";
            try {
                const nft = await metaplex.nfts().findByMint({ mintAddress: lstMint });
                lstName = nft.name;
                lstSymbol = nft.symbol;
            } catch (error) {
                if (LST_WITH_NO_METADATA.includes(lstMint.toBase58())){
                    console.error(`LST mint ${lstMint.toBase58()} has no metadata`);
                } else {
                    console.error(`Error fetching metadata for LST mint ${lstMint.toBase58()}`, error);
                }
            }

            return {
                address: account.pubkey.toBase58(),
                lstMint: lstMint.toString(),
                rstMint: rstMint.toString(),
                bump,
                lstName,
                lstSymbol,
            };
            }); 

            const poolMints = await Promise.all(poolMintsData);

            console.log("Restaking Pool Mints:");
            poolMints.forEach((pool, index) => {
            console.log(`Pool ${index + 1}:`);
            console.log(`  Address: ${pool.address}`);
            console.log(`  LST Mint: ${pool.lstMint}`);
            console.log(`  LST Name: ${pool.lstName}`);
            console.log(`  LST Symbol: ${pool.lstSymbol}`);
            console.log(`  RST Mint: ${pool.rstMint}`);
            console.log(`  Bump: ${pool.bump}`);
            console.log();
        });
        return poolMints;
    } catch (error) {
        console.error("Error fetching Restaking Pool accounts:", error);
        throw error;
    }
}
