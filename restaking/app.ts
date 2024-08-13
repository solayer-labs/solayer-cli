import { unrestake } from "./actions/unrestake_ssol";
import { partner_restake } from "./actions/partner_restake_ssol";
import prompts from "prompts";
import printLogo from "../utils/logo";
import checkSolanaConfig from "../utils/solana-config";

const main = async () => {
  printLogo();
  const { rpcUrl, keypairPath } = await checkSolanaConfig();

  const response = await prompts({
    type: "select",
    name: "value",
    message: "What would you like to do?",
    choices: [
      { title: "Partner Restake", value: "partnerRestake" },
      { title: "Unrestake", value: "unrestake" },
    ],
  });

  switch (response.value) {
    case "partnerRestake":
      const amountResponse = await prompts({
        type: "number",
        name: "amount",
        message: "Enter the amount of SOL to restake:",
        validate: (value) => value > 0 || "Amount must be greater than 0",
      });

      const referrerResponse = await prompts({
        type: "text",
        name: "referrer",
        message: "Enter the referrer address:",
        validate: (value) => value.length > 0 || "Referrer address is required",
      });

      if (amountResponse.amount && referrerResponse.referrer) {
        await partner_restake(
          rpcUrl,
          keypairPath,
          amountResponse.amount.toString(),
          referrerResponse.referrer
        );
      } else {
        console.log("Operation cancelled or already in progress.");
      }
      break;

    case "unrestake":
      const uRamountResponse = await prompts({
        type: "number",
        name: "amount",
        message: "Enter the amount of SOL to restake:",
        validate: (value) => value > 0 || "Amount must be greater than 0",
      });

      if (uRamountResponse.amount) {
        await unrestake(
          rpcUrl,
          keypairPath,
          uRamountResponse.amount.toString()
        );
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
