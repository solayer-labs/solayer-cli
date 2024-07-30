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
  .command("delegate <numberOfSOL> <avsTokenMintAddress>")
  .description("Delegate SOL to endoAvs")
  .action(async (numberOfSOL, avsTokenMintAddress) => {
    await delegate(rpcUrl, keypairPath, numberOfSOL, avsTokenMintAddress);
  });

program
  .command("undelegate <numberOfSOL> <avsTokenMintAddress>")
  .description("Undelegate SOL to endoAvs")
  .action(async (numberOfSOL, avsTokenMintAddress) => {
    await undelegate(rpcUrl, keypairPath, numberOfSOL, avsTokenMintAddress);
  });

program
  .command("transferAuthority <newAuthorityAddr> <avsTokenMintAddress>")
  .description("Transfer authority to a new address")
  .action(async (newAuthorityAddr, avsTokenMintAddress) => {
    await transferAuthority(rpcUrl, keypairPath, newAuthorityAddr, avsTokenMintAddress);
  });

program
  .command("updateAvs <newName> <newUrl> <avsTokenMintAddress>")
  .description("Update an existing endoAvs")
  .action(async (newName, newUrl, avsTokenMintAddress) => {
    await updateAvs(rpcUrl, keypairPath, newName, newUrl, avsTokenMintAddress);
  });

program
  .command("updateMetadata <name> <symbol> <uri> <avsTokenMintAddress>")
  .description("Update the metadata of the endoAvs token")
  .action(async (name, symbol, uri, avsTokenMintAddress) => {
    await updateMetadata(rpcUrl, keypairPath, name, symbol, uri, avsTokenMintAddress);
  });

program.parse(process.argv);
