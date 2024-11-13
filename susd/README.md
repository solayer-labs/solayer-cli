# sUSD Stablecoin

The sUSD program acts as the interface for the users and protocol partners to interact with the decentralized RFQ system that facilitates sUSD operations.

Before beginning, do read more about our terms of service and eligibility requirements [here](https://docs.solayer.org/susd/protocol-info/restrictions)

The CLI tool and sample code for the sUSD protocol be found in this `susd` folder.

Do ensure that you have the project and dependencies set up correctly according to the main project's [README.md](https://github.com/solayer-labs/solayer-cli)

Here's a simple command that you can use to start, which will prompt you for more information from the command line:
```
yarn susd
```

You can view your processing transactions based on the deposit/withdraw proof, or on our [sUSD page](https://app.solayer.org/dashboard/stablecoin-restake)

## Deposit

```
yarn susd --action=deposit --amount=<amount>
```

- `<amount>`: Amount of USDC to deposit

## Withdraw

```
yarn endoavs --action=withdraw --amount=<amount>
```

- `<amount>`: Amount of USDC to withdraw
