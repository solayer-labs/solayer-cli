import * as splStakePool from '@solana/spl-stake-pool';
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { SOLAYER_RESTAKE_POOL } from '../utils/constants';

export async function getExchangeRatesSOL(
    providerUrl: string
){
    const connection = new Connection(providerUrl, "confirmed");
    let info = await splStakePool.stakePoolInfo(connection, SOLAYER_RESTAKE_POOL);
    let nativeSolStaked = info.details.totalLamports.toNumber();
    let lstSupply = parseInt(info.poolTokenSupply);
    let conversionRate = nativeSolStaked / lstSupply;
    console.log(`Conversion Rate: 1 sSOL = ${conversionRate} SOL`);
    console.log(`Total native staked SOL: ${nativeSolStaked / LAMPORTS_PER_SOL}`);
    console.log(`Total sSOL (Supply): ${lstSupply / LAMPORTS_PER_SOL}`);
}

