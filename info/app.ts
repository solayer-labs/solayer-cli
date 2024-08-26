import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prompts from "prompts";
import printLogo from "../utils/logo";
import checkSolanaConfig from "../utils/solana-config";
import { getRestakingPoolMints } from "./actions/getIntegrations";

const main = async () => {
  printLogo();
  const { rpcUrl, keypairPath } = await checkSolanaConfig();

  const argv = yargs(hideBin(process.argv))
    .option("action", {
      alias: "a",
      describe: "Action to perform",
      choices: ["getLsts", "getTvlUsd"],
    }
    ).argv;

  // If no action is provided, prompt the user
  const action =
    argv.action ||
    (
      await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Get Restaking Pools", value: "getRestakingPools" },
          // { title: "Get TVL in USD", value: "getTvlUsd" },
        ],
      })
    ).action;

  switch (action) {
    case "getRestakingPools":
        await getRestakingPoolMints(rpcUrl);
        break;

    // case "getTvlSol":
    //     await getTvlSol();
    //     break;

    default:
      console.log("Invalid option selected.");
      break;
  }
};

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
