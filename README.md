# Solayer Labs: Endogenous AVS (Delegate) Program Interactions
This repository contains TypeScript implementations for interacting with the Solayer Labs endogenous AVS program on Solana. It provides functionality for creating, managing, and updating endoAVS instances.

## Installation
Clone this repository and install the dependencies:
```
git clone git@github.com:solayer-labs/create-avs.git
cd solana-restaking-protocol
npm install
```

## Configuration
Create a .env file in the root directory with the following fields:
```
ANCHOR_WALLET=/path/to/your/keypair/id.json
ANCHOR_PROVIDER_URL=https://your-rpc-provider-url.com
```
- ANCHOR_WALLET: File path to your Solana keypair (usually id.json)
- ANCHOR_PROVIDER_URL: RPC provider URL for Anchor to send transactions E.g. Alchemy/Quicknode/Helius

## Usage
- Create EndoAVS: Use `create_avs.ts` to create a new endogenous AVS by running the
- Delegate and Undelegate: `delegate.ts` provides examples for delegating and undelegating stake
- Set Metadata: Set token metadata for your endoAVS using `set_metadata.ts`
- Transfer Authority: Change the authority of your endoAVS with `transfer_authority.ts`
- Update AVS: Update the name and URL of your endoAVS using `update_avs.ts`