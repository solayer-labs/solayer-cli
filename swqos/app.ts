import { swqos } from "./actions/swqos";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prompts from "prompts";
import printLogo from "../utils/logo";
import checkSolanaConfig from "../utils/solana-config";

const main = async () => {
  printLogo();
  const { rpcUrl, keypairPath } = await checkSolanaConfig();

  const argv = yargs(hideBin(process.argv))
    .option("action", {
      alias: "a",
      describe: "Action to perform",
      choices: ["partnerRestake", "unrestake"],
    })
    .option("amount", {
      alias: "amt",
      describe: "Amount of SOL to restake or unrestake",
      type: "number",
    })
    .option("referrer", {
      alias: "r",
      describe: "Referrer address for partner restake",
      type: "string",
    }).argv;

  // If no action is provided, prompt the user
  const action =
    argv.action ||
    (
      await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Test SWQOS", value: "swqos" },
        ],
      })
    ).action;

  let amount = argv.amount;
  let referrer = argv.referrer;

  switch (action) {
    case "swqos":
      // If amount is not provided via CLI, prompt the user
      if (!amount) {
        amount = parseFloat((
          await prompts({
            type: "text",
            name: "amount",
            message: "Enter the amount of SOL to restake:",
            validate: (value) => parseFloat(value) > 0 || "Amount must be greater than 0",
          })
        ).amount);
      }

      // If referrer is not provided via CLI, prompt the user
      if (!referrer) {
        referrer = (
          await prompts({
            type: "text",
            name: "referrer",
            message: "Enter the referrer address:",
            validate: (value) =>
              value.length > 0 || "Referrer address is required",
          })
        ).referrer;
      }

      if (amount && referrer) {
        await swqos(rpcUrl, keypairPath, amount.toString(), referrer);
      } else {
        console.log("Operation cancelled or already in progress.");
      }
      break;

    default:
      console.log("Invalid option selected.");
      break;
  }
};

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
