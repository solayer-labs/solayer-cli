# Stake-weighted Quality of Service

The free public Stake-weighted Quality of Service (SWQoS) endpoint for Solana projects and builders

We have also written an example benchmark program that submits transactions through our acceleration endpoint and compares performance against standard transaction processing through an RPC service of your choice.

The CLI tool for transaction acceleration and benchmarking can be found in the `swqos` folder.

Do ensure that you have the project and dependencies set up correctly according to the main project's [README.md](https://github.com/solayer-labs/solayer-cli)

Here's a simple command that you can use to start, which will prompt you for more information from the command line:
```
yarn swqos
```

## Test SWQOS

To test transaction acceleration with a single transaction:

```
yarn swqos --action=swqos --amount=<amount> --referrer=<referrer>
```

- `<amount>`: Amount of SOL to use in the test transaction
- `<referrer>`: (Optional) Partner's referrer address.

## Run Benchmark

Compare transaction inclusion rates between accelerated and standard endpoints:

```
yarn swqos --action=benchmark --amount=<amount> --referrer=<referrer> --numTx=<numTx>
```

- `<amount>`: Base amount of SOL per transaction (actual amounts will be randomized between 95-99.9% of this value)
- `<referrer>`: (Optional) Partner's referrer address.
- `<numTx>`: Number of transactions to test (default: 10)

The benchmark will:
1. Send equal numbers of transactions through both accelerated and standard endpoints
2. Track confirmation status of all transactions
3. Provide detailed results including:
   - Success rates for both endpoints
   - Detailed transaction status list
   - Error distribution analysis
   - Performance improvement metrics

### Example Benchmark Output
```
Benchmark Results:
==================

Accelerated Endpoint:
Success Rate: 95.00%
Successful Transactions: 19/20
Failed Transactions: 1/20

Standard Endpoint:
Success Rate: 85.00%
Successful Transactions: 17/20
Failed Transactions: 3/20

Error Distribution:
- Blockhash expired: 2 occurrences
- Transaction not found: 2 occurrences

Comparison:
Improvement with acceleration: 10.00%
```

## API Endpoints

The SWQOS system uses the following endpoints:
- Transaction Construction: `https://app.solayer.org/api/partner/restake/ssol`
- Acceleration Endpoint: `https://acc.solayer.org`
