# Solayer Labs: Endogenous AVS (Delegate) Program Interactions

This repository contains TypeScript implementations for interacting with the Solayer Labs endogenous AVS program on Solana. It provides functionality for creating, managing, and updating endoAVS instances.

## Installation

Clone this repository and install the dependencies:

```
git clone git@github.com:solayer-labs/solayer-cli.git
cd create-avs
yarn install
```

## Configuration

By default, the script will use the same provider and key pair as specified by "solana config get". You can overwrite it by specifying "-k \<path-to-wallet-json-file\>" and "-u \<provider-url\>"

```
solayerAvs -k /path/to/keypair.json -u https://custom-rpc-url.com
```
If not specified, the CLI will use the default Solana configuration.

Here's the Usage section for the README based on the restaking folder's `app.ts` file:

## Restaking

The CLI tool to restake native SOL and unrestake (withdraw) sSOL into native SOL can be found in the `restaking` folder.

### Partner Restake SOL

To restake native SOL through the partner API, use the following command:

```
yarn restaking partnerRestake <amount> <referrer>
```
- `<amount>`: The amount of native SOL to restake
- `<referrer>`: The partner's wallet address (referrer key) used to track referral stakes and calculate Solayer points

### Unrestake SOL

Withdraw restaked native SOL:

```
yarn restaking unrestake <amount>
```

- `<amount>`: Amount of SOL to unrestake


## EndoAVS

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
