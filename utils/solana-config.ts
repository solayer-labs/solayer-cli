import { execSync } from "child_process";

const checkSolanaConfig = () => {
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
  } catch (error) {
    throw new Error(`Failed to retrieve Solana configuration: ${error.message}`);
  }
  return { rpcUrl, keypairPath };
};

export default checkSolanaConfig;
