import { Command, Option } from "commander";
import { createAvs } from "./actions/create";
import { updateAvs } from "./actions/updateAvs";
import { delegate, undelegate } from "./actions/delegate";
import { transferAuthority } from "./actions/transferAuthority";
import { updateMetadata } from "./actions/updateMetadata";
import { execSync } from "child_process";

const program = new Command();

let rpcUrl = "https://api.mainnet-beta.solana.com";
let keypairPath = "~/.config/solana/id.json";
try {
  const solanaConfig = execSync("solana config get", {
    stdio: ["ignore", "pipe", "ignore"],
  }).toString();

  const rpcUrlMatch = solanaConfig.match(/RPC URL:\s*(.*)/);
  const keypairPathMatch = solanaConfig.match(/Keypair Path:\s*(.*)/);

  if (rpcUrlMatch) {
    rpcUrl = rpcUrlMatch[1].trim();
  }

  if (keypairPathMatch) {
    keypairPath = keypairPathMatch[1].trim();
  }
} catch (error) {}

program
  .version("0.0.1")
  .description("CLI for interacting with the endoavs program");
program
  .addOption(
    new Option("-k, --keypair <path-to-wallet-json-file>").default(keypairPath)
  )
  .addOption(new Option("-u, --url <url>").default(rpcUrl));

program
  .command("create <avsName> <avsTokenMintKeyPairPath>")
  .description("Create a new endoAvs")
  .action(async (avsName, avsTokenMintKeyPairPath) => {
    await createAvs(rpcUrl, keypairPath, avsName, avsTokenMintKeyPairPath);
  });

program
  .command("delegate <numberOfSOL> <endoAvsAddress>")
  .description("Delegate SOL to endoAvs")
  .action(async (numberOfSOL, endoAvsAddress) => {
    await delegate(rpcUrl, keypairPath, numberOfSOL, endoAvsAddress);
  });

program
  .command("undelegate <numberOfSOL> <endoAvsAddress>")
  .description("Undelegate SOL to endoAvs")
  .action(async (numberOfSOL, endoAvsAddress) => {
    await undelegate(rpcUrl, keypairPath, numberOfSOL, endoAvsAddress);
  });

program
  .command("transferAuthority <newAuthorityAddr> <endoAvsAddress>")
  .description("Transfer authority to a new address")
  .action(async (newAuthorityAddr, endoAvsAddress) => {
    await transferAuthority(rpcUrl, keypairPath, newAuthorityAddr, endoAvsAddress);
  });

program
  .command("updateAvs <newName> <newUrl> <endoAvsAddress>")
  .description("Update an existing endoAvs")
  .action(async (newName, newUrl, endoAvsAddress) => {
    await updateAvs(rpcUrl, keypairPath, newName, newUrl, endoAvsAddress);
  });

program
  .command("updateMetadata <name> <symbol> <uri> <endoAvsAddress>")
  .description("Update the metadata of the endoAvs token")
  .action(async (name, symbol, uri, endoAvsAddress) => {
    console.log(rpcUrl);
    await updateMetadata(rpcUrl, keypairPath, name, symbol, uri, endoAvsAddress);
  });

program.parse(process.argv);
