# Solayer Restaking

The `restaking_program` is designed to handle the initialization, restaking, and un-restaking of tokens within the Solayer restaking marketplace. The program leverages several programs and accounts to manage these processes securely and efficiently.

## Integration Guide

### Step 1: Build the UI for user deposits

Partners can create a component or page that allows end-users to define how much native SOL to restake with Solayer, then click on a button to receive a signable transaction.

Partners will be able to call our API endpoint to construct a transaction to stake native SOL to the Solayer restaking program. Each generated transaction will be constructed based on the amount and the address in the:

- Endpoint: `https://app.solayer.org/api/partner/restake/ssol`
- Parameters
  - `amount` - the amount of native SOL that the user wishes to restake
  - `staker` - the end-user’s wallet address
  - `referrerkey` - your (the partner) wallet’s address that will be used to track referral stake and to calculate Solayer points

Refer to the `getServerSignedTx()` function in [partner_restake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/partner_restake_ssol.ts#L12-L44) for an example on how to call the partner restaking API endpoint.

The API will respond with a response body that has

- `transaction` - base64 encoded serialized transaction
- `message` - a message for errors or success messages
- Successful responses will have a message of `“restaking {sol_amount} SOL for {sSOL_amount} sSOL”`

From there, you can send the generated transaction signature to the user on the frontend to sign using their wallet E.g. Phantom.

After the end-user has signed the transaction, they would have restaked native SOL and received Solayer SOL (sSOL) in their wallets. sSOL is liquid, and end users can [use sSOL DeFi applications](https://docs.solayer.org/ssol/ssol-in-defi) (E.g. liquidity pairs, collateral) or [delegate to AVSs](https://docs.solayer.org/endogenous-avs/delegate-tokens) to earn additional rewards.

### Step 2: Show User Balances

Next, partners can show user balances by retrieving the balance of sSOL tokens that a user has in their wallet.

To price sSOL to SOL, you can check our stake pool at [po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2](https://solscan.io/account/po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2).
For example you can run this command to get details on our stake pool using the spl-stake-pool CLI. The conversion rate between sSOL and SOL (E.g. 1 sSOL = ~1.0148 SOL) can be found by dividing the total stake pool’s stake by the stake pool token supply.

```
spl-stake-pool list -v po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2
```

### Step 3: Handle withdrawals

To allow users to withdraw their sSOL into native SOL, there are a couple of instructions that will need to be added to the constructed transaction:

1. Connect to the Solana blockchain and call the unrestake method on our restaking program. Here are the accounts that are used to make this instruction:

```
RESTAKING_PROGRAM_ID = new PublicKey("sSo1iU21jBrU9VaJ8PJib1MtorefUV4fzC9GURa2KNn")
POOL_ADDRESS = new PublicKey("3sk58CzpitB9jsnVzZWwqeCn2zcXVherhALBh88Uw9GQ");
SSOL_MINT = new PublicKey("sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh");
STAKE_POOL_MINT = new PublicKey("sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4");
```

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L52-L84) for an example on how to call the `restakeProgram.methods.unrestake()` method to construct an unrestake instruction.

2. Next, create an Approve instruction to access the LST’s associated token account to execute the other operations to unstake the native SOL from our stake pool:

```
let approveInstruction = createApproveInstruction(
    lstAta,
    feePayerPublicKey,
    feePayerPublicKey,
    convertFromDecimalBN(amount, 9).toNumber(),
)
```

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L88-L95) for an example.

3. Then create a stake account to receive the user’s stake that is being withdrawn from our stake pool.

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L97-L117) for an example on how to create this stake account.

4. Make the withdrawStake call to withdraw stake into the stake account we created. Here are the accounts that we’re using to create this instruction:

```
stakePool:          po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2
validatorList:      nk5E1Gc2rCuU2MDTRqdcQdiMfV9KnZ6JHykA1cTJQ56
withdrawAuthority:  H5rmot8ejBUWzMPt6E44h27xj5obbSz3jVuK4AsJpHmv
validatorStake:     CpWqBteUJodiTcGYWsxq4WTaBPoZJyKkBbkWwAMXSyTK
```

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L120-L133) for an example on how to withdraw stake from the stake pool.

5. Deactivate the stake account so the user can withdraw their deposit.

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L136-L140) for an example of how to deactivate the stake account.

6. Finally, let the user sign and confirm the transaction

## Restaking CLI Tool

The CLI tool to restake native SOL and unrestake (withdraw) sSOL into native SOL can be found in this `restaking` folder.

Do ensure that you have the project and dependencies set up correctly according to the main project's [README.md](https://github.com/solayer-labs/solayer-cli)

Here's a simple command that you can use to start, which will prompt you for more information from the command line:
```
yarn restaking
```

### 1. Blink Restake SOL

To restake native SOL through the blink API endpoint, use the following command:

```
yarn restaking --action=blinkRestake --amount=<amount>
```

- `<amount>`: The amount of native SOL to restake

### 2. Partner Restake SOL

To restake native SOL through the partner API endpoint, use the following command:

```
yarn restaking --action=partnerRestake --amount=<amount> --referrer=<referrer>
```

- `<amount>`: The amount of native SOL to restake
- `<referrer>`: The partner's wallet address (referrer key) used to track referral stakes and calculate Solayer points

### 3. Unrestake SOL

Withdraw restaked native SOL:

```
yarn restaking --action=unrestake --amount=<amount>
```

- `<amount>`: Amount of SOL to unrestake
