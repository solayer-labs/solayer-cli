# EndoAVS

The endoAVS program provides functionality for creating, managing, and updating endoAVS instances.

The CLI tool to create and manage an endoAVS can be found in this `endoavs` folder.

Do ensure that you have the project and dependencies set up correctly according to the main project's [README.md](https://github.com/solayer-labs/solayer-cli)

Here's a simple command that you can use to start, which will prompt you for more information from the command line:
```
yarn endoavs
```

## Create EndoAVS

Create a new endogenous AVS:

```
yarn endoavs --action=create --avsName=<avsName> --avsTokenMintKeyPairPath=<avsTokenMintKeyPairPath>
```

- `<avsName>`: Name of the new AVS
- `<avsTokenMintKeyPairPath>`: Path to the keypair file for the AVS token mint

You can generate the keypair file for the AVS token mint, and even customize it as a vanity address that starts with the first few characters of your project's name. To create it, run the following command. Take not that token mints that have the first 5 or more characters take a very long time to generate.

```
solana-keygen grind --starts-with <First 2-5 characters go here>:1
```

## Delegate

Delegate SOL to an endogenous AVS:

```
yarn endoavs --action=delegate --numberOfSOL=<numberOfSOL> --endoAvsAddress=<endoAvsAddress>
```

- `<numberOfSOL>`: Amount of SOL to delegate
- `<endoAvsAddress>`: Address of the endoAVS

## Undelegate

Undelegate SOL from an endogenous AVS:

```
yarn endoavs --action=undelegate --numberOfSOL=<numberOfSOL> --endoAvsAddress=<endoAvsAddress>
```

- `<numberOfSOL>`: Amount of SOL to undelegate
- `<endoAvsAddress>`: Address of the endoAVS

## Transfer Authority

Change the authority of your endoAVS:

```
yarn endoavs --action=transferAuthority --newAuthorityAddr=<newAuthorityAddr> --endoAvsAddress=<endoAvsAddress>
```

- `<newAuthorityAddr>`: Address of the new authority
- `<endoAvsAddress>`: Address of the endoAVS

## Update AVS

Update the name and URL of your endoAVS:

```
yarn endoavs --action=updateAvs --newName=<newName> --newUrl=<newUrl> --endoAvsAddress=<endoAvsAddress>
```

- `<newName>`: New name for the AVS
- `<newUrl>`: New URL for the AVS
- `<endoAvsAddress>`: Address of the endoAVS

## Update/Set Metadata

Update or set token metadata for your endoAVS:

```
yarn endoavs --action=updateMetadata --name=<name> --symbol=<symbol> --uri=<uri> --endoAvsAddress=<endoAvsAddress>
```

- `<name>`: Name for the token metadata
- `<symbol>`: Symbol for the token metadata
- `<uri>`: URI for the token metadata
- `<endoAvsAddress>`: Address of the endoAVS
