import { execSync } from "child_process";

interface ExecError extends Error {
  stderr?: Buffer;
}

function isExecError(error: Error): error is ExecError {
  return "stderr" in error;
}

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
  } catch (error: unknown) {
    let errorMessage: string;
    if (error instanceof Error && isExecError(error)) {
      const stderrOutput = error.stderr?.toString() ?? "";
      errorMessage = stderrOutput
        ? `${error.message}\nStderr: ${stderrOutput}`
        : error.message;
    } else {
      errorMessage = String(error);
    }
    throw new Error(
      `Failed to retrieve Solana configuration: ${errorMessage}`,
      { cause: error }
    );
  }
  return { rpcUrl, keypairPath };
};

export default checkSolanaConfig;
