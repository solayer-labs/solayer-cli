import { Command, Option } from "commander";
import { createAvs } from "./actions/create";
import { updateAvs } from "./actions/updateAvs";
import { delegate, undelegate } from "./actions/delegate";
import { transferAuthority } from "./actions/transferAuthority";
import { updateMetadata } from "./actions/updateMetadata";

const program = new Command();

program
  .version("0.0.1")
  .description("CLI for interacting with the endoavs program");
program
  .addOption(
    new Option("-k, --key <path-to-wallet-json-file>").env("ANCHOR_WALLET")
  )
  .addOption(new Option("-p, --provider-url <url>").env("ANCHOR_PROVIDER_URL"));

program
  .command("create <avsName>")
  .description("Create a new endoAvs")
  .action(async (avsName) => {
    await createAvs(avsName);
  });

program
  .command("delegate <numberOfSOL> <avsTokenMintAddress>")
  .description("Delegate SOL to endoAvs")
  .action(async (numberOfSOL, avsTokenMintAddress) => {
    await delegate(numberOfSOL, avsTokenMintAddress);
  });

program
  .command("undelegate <numberOfSOL> <avsTokenMintAddress>")
  .description("Undelegate SOL to endoAvs")
  .action(async (numberOfSOL, avsTokenMintAddress) => {
    await undelegate(numberOfSOL, avsTokenMintAddress);
  });

program
  .command("transferAuthority <newAuthorityAddr> <avsTokenMintAddress>")
  .description("Transfer authority to a new address")
  .action(async (newAuthorityAddr, avsTokenMintAddress) => {
    await transferAuthority(newAuthorityAddr, avsTokenMintAddress);
  });

program
  .command("updateAvs <newName> <newUrl> <avsTokenMintAddress>")
  .description("Update an existing endoAvs")
  .action(async (newName, newUrl, avsTokenMintAddress) => {
    await updateAvs(newName, newUrl, avsTokenMintAddress);
  });

program
  .command("updateMetadata <name> <symbol> <uri> <avsTokenMintAddress>")
  .description("Update the metadata of the endoAvs token")
  .action(async (name, symbol, uri, avsTokenMintAddress) => {
    await updateMetadata(name, symbol, uri, avsTokenMintAddress);
  });

program.parse(process.argv);
