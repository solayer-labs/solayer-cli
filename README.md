# Solayer Labs: Endogenous AVS (Delegate) Program Interactions

This repository contains TypeScript implementations for interacting with the Solayer Labs endogenous AVS program on Solana. It provides functionality for creating, managing, and updating endoAVS instances.

## Installation

Clone this repository and install the dependencies:

```
git clone git@github.com:solayer-labs/create-avs.git
cd create-avs
yarn install
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

- Create EndoAVS: Use `yarn solayerAvs create` to create a new endogenous AVS
- Delegate: Use `yarn solayerAvs delegate` to delegate SOL to endogenous AVS
- Undelegate: Use `yarn solayerAvs undelegate ` to undelegate SOL to endogenous AVS
- Transfer Authority: Use `yarn solayerAvs transferAuthority ` to change the authority of your endoAVS
- Update AVS: Use `yarn solayerAvs updateAvs` to update the name and URL of your endoAVS
- Update/Set Metadata: Use `yarn solayerAvs updateMetadata` to update/set token metadata for your endoAVS
