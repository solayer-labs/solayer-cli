import { deposit } from "./actions/deposit";
import { withdraw } from "./actions/withdraw";
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
      choices: [
        "deposit",
        "withdraw",
      ],
    })
    .option("amount", {
      describe: "Amount of USDC deposit or sUSD to withdraw",
      type: "number",
    })

  const action =
    argv.action ||
    (
      await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Deposit USDC", value: "deposit" },
          { title: "Withdraw USDC", value: "withdraw" },
        ],
      })
    ).action;

  switch (action) {
    case "deposit":
    case "withdraw":
      const amount =
        argv.amount ||
        parseFloat((
          await prompts({
            type: "text",
            name: "amount",
            message: `Enter amount of USDC to ${action}:`,
            validate: (value) => parseFloat(value) > 0.5 || "Amount must be greater than 0.5",
          })
        ).amount);

      if (action === "deposit") {
        console.log(amount);
        await deposit(rpcUrl, keypairPath, amount);
      } else {
        await withdraw(rpcUrl, keypairPath, amount);
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
