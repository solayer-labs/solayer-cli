# Solayer Labs CLI Tool

This repository contains TypeScript implementations for interacting with Solayer Labs programs on Solana, such as the restaking, endogenous AVS (delegation) and sUSD programs. For more information about Solayer, you can also refer to our [docs](https://docs.solayer.org).

## Installation

Clone this repository and install the dependencies:

```
git clone git@github.com:solayer-labs/solayer-cli.git
cd solayer-cli
yarn install
```

## CLI Commands

**!! Important !!**

Do refer to the respective `README.md` files in the `restaking`, `endoavs`, `susd` and `swqos` folders for the CLI commands to interact with our restaking, endoAVS, and sUSD programs respectively: 
 - [/restaking](https://github.com/solayer-labs/solayer-cli/restaking)
 - [/endoavs](https://github.com/solayer-labs/solayer-cli/endoavs)
 - [/susd](https://github.com/solayer-labs/solayer-cli/susd)
 - [/swqos](https://github.com/solayer-labs/solayer-cli/swqos)

We also have a folder that has sample code on how to retrieve information about Solayer, for example, the LSTs included in our restaking program or APY info
 - [/info](https://github.com/solayer-labs/solayer-cli/tree/main/info)

**!! Important !!**

__________

## Restaking Process and Technical Details

### Deposit Process

Here’s a quick overview of what happens when a user makes a deposit:

#### Step 1: Staking

Native SOL is staked into the Solayer Stake Pool (po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2) and an intermediate LST is minted (the stake pool mint - sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4)

#### Step 2: Restaking

Stake pool mint (intermediate) is restaked into our restaking program (sSo1iU21jBrU9VaJ8PJib1MtorefUV4fzC9GURa2KNn) and sSOL is minted (sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh)

#### Step 3: Incentives

User holds sSOL and accumulates points

Here's a sample transaction to dive into how it's implemented - [Solscan Link ](https://solscan.io/tx/5cJ2eeBUjuugVhCLW7vys8usbcE73AS6WYwxQNdmgBJYoTpoi9w9KL54VBjpEZYuMeDkEaTVfzZozsVkx4ZfBjK)

### Restake function

Interact with our restaking program by calling the `restake` function to allow end users to restake a specified amount of tokens from the user into LRT tokens.

Partners integrating with us can call the partner restaking API. This allows us to track the amount of stake referred from each of our partners, and be able to allocate incentives and delegations appropriately.

Accounts: The restake function interacts with various accounts:

- Signer (mutable, signer): The user or entity initiating the transaction
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

### Unrestake function

Interact with our restaking program by calling the `unrestake` function to allow end users to withdraw a specified amount into the underlying LST or native SOL.

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
- [sUSD Program](https://github.com/solayer-labs/solayer-cli/blob/main/endoavs/utils/susd_pool.json)

You can also learn more on the [Solayer website](https://solayer.org/) as well as our [docs](https://docs.solayer.org/)

Additional Parameters for Restaking Program

- [Document Link](https://docs.google.com/document/d/1FWAKJS-eimrhqNu9uA6P-hP_pJ69wDl54ELQW5j45_U/edit#heading=h.yzvkhpaun3bj)
