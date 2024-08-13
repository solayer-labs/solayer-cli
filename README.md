# Solayer Labs CLI Tool
This repository contains TypeScript implementations for interacting with Solayer Labs programs on Solana, such as the restaking program and endogenous AVS programs. 

## Installation

Clone this repository and install the dependencies:

```
git clone git@github.com:solayer-labs/solayer-cli.git
cd solayer-cli
yarn install
```

## Configuration

By default, the script will use the same provider and key pair as specified by "solana config get". You can overwrite it by specifying `-k <path-to-wallet-json-file>` and `-u <provider-url>`

```
solayerAvs -k /path/to/keypair.json -u https://custom-rpc-url.com
```
If not specified, the CLI will use the default Solana configuration.

## Restaking

The `restaking_program` is designed to handle the initialization, restaking, and un-restaking of tokens within the Solayer restaking marketplace. The program leverages several programs and accounts to manage these processes securely and efficiently.

### Integration Guide
#### Step 1: Build the UI for user deposits
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

#### Step 2: Show User Balances
Next, partners can show user balances by retrieving the balance of sSOL tokens that a user has in their wallet.

To price sSOL to SOL, you can check our stake pool at [po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2](https://solscan.io/account/po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2). 
For example you can run this command to get details on our stake pool using the spl-stake-pool CLI. The conversion rate between sSOL and SOL (E.g. 1 sSOL = ~1.0148 SOL) can be found by dividing the total stake pool’s stake by the stake pool token supply.

```
spl-stake-pool list -v po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2
```
#### Step 3: Handle withdrawals
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
stakePool:          new PublicKey('po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2'),
validatorList:      new PublicKey('nk5E1Gc2rCuU2MDTRqdcQdiMfV9KnZ6JHykA1cTJQ56'),
withdrawAuthority:  new PublicKey('H5rmot8ejBUWzMPt6E44h27xj5obbSz3jVuK4AsJpHmv'),
validatorStake:     new PublicKey('CpWqBteUJodiTcGYWsxq4WTaBPoZJyKkBbkWwAMXSyTK'),
```
Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L120-L133) for an example on how to withdraw stake from the stake pool.

5. Deactivate the stake account so the user can withdraw their deposit.

Refer to [unrestake_ssol.ts](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/actions/unrestake_ssol.ts#L136-L140) for an example on how to deactivate the stake account.

6. Finally, let the user sign and confirm the transaction

### Restaking CLI Tool

The CLI tool to restake native SOL and unrestake (withdraw) sSOL into native SOL can be found in the `restaking` folder.

#### 1. Partner Restake SOL

To restake native SOL through the partner API endpoint, use the following command:

```
yarn restaking partnerRestake <amount> <referrer>
```
- `<amount>`: The amount of native SOL to restake
- `<referrer>`: The partner's wallet address (referrer key) used to track referral stakes and calculate Solayer points

#### 2. Unrestake SOL

Withdraw restaked native SOL:

```
yarn restaking unrestake <amount>
```

- `<amount>`: Amount of SOL to unrestake


## EndoAVS
The endoAVS program provides functionality for creating, managing, and updating endoAVS instances.

The CLI tool to create and manage an endoAVS can be found in the `endoavs` folder.

### Create EndoAVS

Create a new endogenous AVS:

```
yarn solayerAvs create <avsName> <avsTokenMintKeyPairPath>
```
- `<avsName>`: Name of the new AVS
- `<avsTokenMintKeyPairPath>`: Path to the keypair file for the AVS token mint

### Delegate

Delegate SOL to an endogenous AVS:

```
yarn solayerAvs delegate <numberOfSOL> <endoAvsAddress>
```

- `<numberOfSOL>`: Amount of SOL to delegate
- `<endoAvsAddress>`: Address of the endoAVS

### Undelegate

Undelegate SOL from an endogenous AVS:

```
yarn solayerAvs undelegate <numberOfSOL> <endoAvsAddress>
```

- `<numberOfSOL>`: Amount of SOL to undelegate
- `<endoAvsAddress>`: Address of the endoAVS

### Transfer Authority

Change the authority of your endoAVS:

```
yarn solayerAvs transferAuthority <newAuthorityAddr> <endoAvsAddress>
```

- `<newAuthorityAddr>`: Address of the new authority
- `<endoAvsAddress>`: Address of the endoAVS

### Update AVS

Update the name and URL of your endoAVS:

```
yarn solayerAvs updateAvs <newName> <newUrl> <endoAvsAddress>
```

- `<newName>`: New name for the AVS
- `<newUrl>`: New URL for the AVS
- `<endoAvsAddress>`: Address of the endoAVS

### Update/Set Metadata

Update or set token metadata for your endoAVS:

```
yarn solayerAvs updateMetadata <name> <symbol> <uri> <endoAvsAddress>
```

- `<name>`: Name for the token metadata
- `<symbol>`: Symbol for the token metadata
- `<uri>`: URI for the token metadata
- `<endoAvsAddress>`: Address of the endoAVS

For all commands, you can use the `-h` or `--help` flag to get more information about the command and its arguments.


## Architecture and Technical Details

### Deposit Process
Here’s a quick overview of what happens when a user makes a deposit:

#### Step 1: Staking
Native SOL is staked into the Solayer Stake Pool (po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2) and an intermediate LST is minted (the stake pool mint - sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4)

#### Step 2: Restaking
Stake pool mint (intermediate) is restaked into our restaking program (sSo1iU21jBrU9VaJ8PJib1MtorefUV4fzC9GURa2KNn) and sSOL is minted (sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh)

#### Step 3: Incentives
User holds sSOL and accumulates points

Here's a sample transaction to dive into how it's implemented - [Solscan Link ](https://solscan.io/tx/5cJ2eeBUjuugVhCLW7vys8usbcE73AS6WYwxQNdmgBJYoTpoi9w9KL54VBjpEZYuMeDkEaTVfzZozsVkx4ZfBjK)

### restake function
Interact with our restaking program by calling the restake function to allow end users to restake a specified amount of tokens from the user into LRT tokens.

As we are enforcing TVL targets as we run our staking epochs, LRT builders integrating with us will receive a dedicated URL/API keys (coming soon) that allows them to obtain a counter signature from the Solayer signer. This is because all staking deposit transactions interacting with the restaking program need to be co-signed by the Solayer signer before the deposit can be processed by the program. Access to the Solayer signer is provisioned by that API key.

In the future, we will also offer additional APIs for retrieving points/badges corresponding to each staker’s account for our partners to display on their frontends.

Accounts: The restake function interacts with various accounts:
 - Signer (mutable, signer): The user or entity initiating the transaction
 - SolayerAdmin: An admin account for additional checks or balances
 - LST and LRT Mints: Token mints for the two types of tokens involved in restaking
 - lstAta, rstAta: User's token accounts for LST and RST tokens.
 - vault and pool: Accounts that hold tokens and manage state during operations.
     - The Vault is where LST tokens are stored during staking
     - The Pool tracks the overall state and balances
 - TokenProgram, SystemProgram, AssociatedTokenProgram: Standard Solana programs required for token and system operations
 - Parameters:
     - amount (u64): The amount of LST tokens to restake.

Under the hood, calling the restake function will:
1. Check if the Solayer signer is a co-signer of the transaction
2. Unlocks the restaking account
3. Stakes the amount into the restaking AVSs and validators
4. Mints the AVS token
5. Locks the staking account again

### unrestake function
Interact with our restaking program by calling the unrestake function to allow end users to withdraw a specified amount into the underlying LST or native SOL.

Accounts: The `unrestake` function interacts with various accounts:
 - Signer (mutable, signer): The user or entity initiating the transaction
 - LST and LRT Mints: Token mints for the two types of tokens involved in restaking
 - lstAta, rstAta: User's token accounts for LST and RST tokens.
 - vault and pool: Accounts that hold tokens and manage state during operations.
     - The Vault is where LST tokens are stored during staking
     - The Pool tracks the overall state and balances
 - TokenProgram, SystemProgram, AssociatedTokenProgram: Standard Solana programs required for token and system operations
 - Parameters:
     - amount (u64): The amount of tokens to un-restake.

Under the hood, calling the restake function will:
1. Unlocks the restaking account
2. Unstakes the amount into a stake account under the user’s ownership
3. Burns the AVS token
4. Locks the staking account again

## Important Resources
Links to IDL Files
 - [Restaking Program](https://github.com/solayer-labs/solayer-cli/blob/main/restaking/utils/restaking_program.json)
 - [EndoAVS Program](https://github.com/solayer-labs/solayer-cli/blob/main/endoavs/utils/endoavs_program.json)

Additional Parameters for Restaking Program
 - [Document Link](https://docs.google.com/document/d/1FWAKJS-eimrhqNu9uA6P-hP_pJ69wDl54ELQW5j45_U/edit#heading=h.yzvkhpaun3bj) 
