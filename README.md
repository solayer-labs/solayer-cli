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

By default, the script will use the same provider and key pair as specified by "solana config get". You can overwrite it by specifying "-k \<path-to-wallet-json-file\>" and "-p \<provider-url\>"

## Usage

- Create EndoAVS: Use `yarn solayerAvs create` to create a new endogenous AVS
- Delegate: Use `yarn solayerAvs delegate` to delegate SOL to endogenous AVS
- Undelegate: Use `yarn solayerAvs undelegate ` to undelegate SOL to endogenous AVS
- Transfer Authority: Use `yarn solayerAvs transferAuthority ` to change the authority of your endoAVS
- Update AVS: Use `yarn solayerAvs updateAvs` to update the name and URL of your endoAVS
- Update/Set Metadata: Use `yarn solayerAvs updateMetadata` to update/set token metadata for your endoAVS
