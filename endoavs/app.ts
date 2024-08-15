import { createAvs } from "./actions/create";
import { updateAvs } from "./actions/updateAvs";
import { delegate, undelegate } from "./actions/delegate";
import { transferAuthority } from "./actions/transferAuthority";
import { updateMetadata } from "./actions/updateMetadata";
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
        "create",
        "delegate",
        "undelegate",
        "transferAuthority",
        "updateAvs",
        "updateMetadata",
      ],
    })
    .option("avsName", {
      describe: "Name of the AVS",
      type: "string",
    })
    .option("avsTokenMintKeyPairPath", {
      describe: "Path to AVS token mint keypair",
      type: "string",
    })
    .option("numberOfSOL", {
      describe: "Number of SOL to delegate or undelegate",
      type: "number",
    })
    .option("endoAvsAddress", {
      describe: "Address of the endoAvs",
      type: "string",
    })
    .option("newAuthorityAddr", {
      describe: "New authority address",
      type: "string",
    })
    .option("newName", {
      describe: "New name for the AVS",
      type: "string",
    })
    .option("newUrl", {
      describe: "New URL for the AVS",
      type: "string",
    })
    .option("name", {
      describe: "Name for the metadata",
      type: "string",
    })
    .option("symbol", {
      describe: "Symbol for the metadata",
      type: "string",
    })
    .option("uri", {
      describe: "URI for the metadata",
      type: "string",
    }).argv;

  const action =
    argv.action ||
    (
      await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Create AVS", value: "create" },
          { title: "Delegate SOL", value: "delegate" },
          { title: "Undelegate SOL", value: "undelegate" },
          { title: "Transfer Authority", value: "transferAuthority" },
          { title: "Update AVS", value: "updateAvs" },
          { title: "Update Metadata", value: "updateMetadata" },
        ],
      })
    ).action;

  switch (action) {
    case "create":
      const avsName =
        argv.avsName ||
        (
          await prompts({
            type: "text",
            name: "avsName",
            message: "Enter the name of the AVS:",
            validate: (value) => value.length > 0 || "AVS name is required",
          })
        ).avsName;

      const avsTokenMintKeyPairPath =
        argv.avsTokenMintKeyPairPath ||
        (
          await prompts({
            type: "text",
            name: "avsTokenMintKeyPairPath",
            message: "Enter the path to the AVS token mint keypair:",
            validate: (value) =>
              value.length > 0 || "Token mint keypair path is required",
          })
        ).avsTokenMintKeyPairPath;

      await createAvs(rpcUrl, keypairPath, avsName, avsTokenMintKeyPairPath);
      break;

    case "delegate":
    case "undelegate":
      const numberOfSOL =
        argv.numberOfSOL ||
        parseFloat((
          await prompts({
            type: "text",
            name: "numberOfSOL",
            message: `Enter the number of SOL to ${action}:`,
            validate: (value) => parseFloat(value) > 0 || "Amount must be greater than 0",
          })
        ).numberOfSOL);

      let endoAvsAddress =
        argv.endoAvsAddress ||
        (
          await prompts({
            type: "text",
            name: "endoAvsAddress",
            message: "Enter the endoAvs address:",
            validate: (value) =>
              value.length > 0 || "endoAvs address is required",
          })
        ).endoAvsAddress;

      if (action === "delegate") {
        await delegate(rpcUrl, keypairPath, numberOfSOL, endoAvsAddress);
      } else {
        await undelegate(rpcUrl, keypairPath, numberOfSOL, endoAvsAddress);
      }
      break;

    case "transferAuthority":
      const newAuthorityAddr =
        argv.newAuthorityAddr ||
        (
          await prompts({
            type: "text",
            name: "newAuthorityAddr",
            message: "Enter the new authority address:",
            validate: (value) =>
              value.length > 0 || "New authority address is required",
          })
        ).newAuthorityAddr;
      
      const endoAvsAddress_transferAuthority =
        argv.endoAvsAddress ||
        (
          await prompts({
            type: "text",
            name: "endoAvsAddress",
            message: "Enter the endoAvs address:",
            validate: (value) =>
              value.length > 0 || "endoAvs address is required",
          })
        ).endoAvsAddress;

      await transferAuthority(
        rpcUrl,
        keypairPath,
        newAuthorityAddr,
        endoAvsAddress_transferAuthority
      );
      break;

    case "updateAvs":
      const newName =
        argv.newName ||
        (
          await prompts({
            type: "text",
            name: "newName",
            message: "Enter the new name for the AVS:",
            validate: (value) => value.length > 0 || "New AVS name is required",
          })
        ).newName;

      const newUrl =
        argv.newUrl ||
        (
          await prompts({
            type: "text",
            name: "newUrl",
            message: "Enter the new URL for the AVS:",
            validate: (value) => value.length > 0 || "New AVS URL is required",
          })
        ).newUrl;
      
      const endoAvsAddress_updateAvs =
        argv.endoAvsAddress ||
        (
          await prompts({
            type: "text",
            name: "endoAvsAddress",
            message: "Enter the endoAvs address:",
            validate: (value) =>
              value.length > 0 || "endoAvs address is required",
          })
        ).endoAvsAddress;

      await updateAvs(
        rpcUrl,
        keypairPath,
        newName,
        newUrl,
        endoAvsAddress_updateAvs
      );
      break;

    case "updateMetadata":
      const name =
        argv.name ||
        (
          await prompts({
            type: "text",
            name: "name",
            message: "Enter the name for the metadata:",
            validate: (value) => value.length > 0 || "Name is required",
          })
        ).name;

      const symbol =
        argv.symbol ||
        (
          await prompts({
            type: "text",
            name: "symbol",
            message: "Enter the symbol for the metadata:",
            validate: (value) => value.length > 0 || "Symbol is required",
          })
        ).symbol;

      const uri =
        argv.uri ||
        (
          await prompts({
            type: "text",
            name: "uri",
            message: "Enter the URI for the metadata:",
            validate: (value) => value.length > 0 || "URI is required",
          })
        ).uri;
      
      const endoAvsAddress_meta =
        argv.endoAvsAddress ||
        (
          await prompts({
            type: "text",
            name: "endoAvsAddress",
            message: "Enter the endoAvs address:",
            validate: (value) =>
              value.length > 0 || "endoAvs address is required",
          })
        ).endoAvsAddress;

      await updateMetadata(
        rpcUrl,
        keypairPath,
        name,
        symbol,
        uri,
        endoAvsAddress_meta
      );
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
