import chalk from "chalk";
import figlet from "figlet";

const printLogo = () => {
  const NAME = "Solayer";

  console.log(chalk.green(figlet.textSync(NAME)));
};

export default printLogo;
