import { swqos } from "./actions/swqos";
import { benchmark } from "./actions/benchmark";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prompts from "prompts";
import printLogo from "../utils/logo";
import checkSolanaConfig from "../utils/solana-config";

const DEFAULT_REFERRER = "EBUYfabG1S6qStozxCVA1rFGYix436qujMmNecaUd5b2";

const main = async () => {
  printLogo();
  const { rpcUrl, keypairPath } = await checkSolanaConfig();

  const argv = yargs(hideBin(process.argv))
    .option("action", {
      alias: "a",
      describe: "Action to perform",
      choices: ["swqos", "benchmark"],
    })
    .option("amount", {
      alias: "amt",
      describe: "Amount of SOL to restake or unrestake",
      type: "number",
    })
    .option("referrer", {
      alias: "r",
      describe: "Referrer address (press enter to use default)",
      type: "string",
    })
    .option("numTx", {
      alias: "n",
      describe: "Number of transactions for benchmark",
      type: "number",
    }).argv;

  const action =
    argv.action ||
    (
      await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Test SWQOS", value: "swqos" },
          { title: "Run Benchmark", value: "benchmark" },
        ],
      })
    ).action;

  let amount = argv.amount;
  let referrer = argv.referrer;
  let numTransactions = argv.numTx;

  switch (action) {
    case "swqos":
      if (!amount) {
        amount = parseFloat(
          (
            await prompts({
              type: "text",
              name: "amount",
              message: "Enter the amount of SOL to restake:",
              validate: (value) => parseFloat(value) > 0 || "Amount must be greater than 0",
            })
          ).amount
        );
      }

      if (!referrer) {
        const response = await prompts({
          type: "text",
          name: "referrer",
          message: `Enter the referrer address (skip -> enter):`,
          validate: value => 
            value === "" || value.length > 0 || "Invalid address"
        });
        referrer = response.referrer || DEFAULT_REFERRER;
      }

      if (amount) {
        await swqos(rpcUrl, keypairPath, amount.toString(), referrer);
      } else {
        console.log("Operation cancelled or already in progress.");
      }
      break;

    case "benchmark":
      if (!amount) {
        amount = parseFloat(
          (
            await prompts({
              type: "text",
              name: "amount",
              message: "Enter the amount of SOL per transaction:",
              validate: (value) => parseFloat(value) > 0 || "Amount must be greater than 0",
            })
          ).amount
        );
      }

      if (!referrer) {
        const response = await prompts({
          type: "text",
          name: "referrer",
          message: `Enter the referrer address (skip -> enter):`,
          validate: value => 
            value === "" || value.length > 0 || "Invalid address"
        });
        referrer = response.referrer || DEFAULT_REFERRER;
      }

      if (!numTransactions) {
        numTransactions = parseInt(
          (
            await prompts({
              type: "text",
              name: "numTx",
              message: "Enter the number of transactions to test:",
              initial: "10",
              validate: (value) => 
                parseInt(value) > 0 || "Number of transactions must be greater than 0",
            })
          ).numTx
        );
      }

      if (amount && numTransactions) {
        await benchmark(rpcUrl, keypairPath, amount.toString(), referrer, numTransactions);
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