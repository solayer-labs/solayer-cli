import { Command, Option } from "commander";
import { unrestake } from "./actions/unrestake_ssol";
import { execSync } from "child_process";
import { partner_restake } from "./actions/partner_restake_ssol";

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
  .command("partnerRestake <amount> <referrer>")
  .description("Restaking native SOL through partner API")
  .action(async (amount, referrer) => {
    await partner_restake(rpcUrl, keypairPath, amount, referrer);
  });

program
  .command("unrestake <amount>")
  .description("Withdrawing restaked native SOL")
  .action(async (amount) => {
    await unrestake(rpcUrl, keypairPath, amount);
  });

program.parse(process.argv);
