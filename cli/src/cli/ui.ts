// CLI UI utilities
import figlet from "figlet";
import chalk from "chalk";
import boxen from "boxen";
import { readFileSync } from "fs";
import { join } from "path";

export const displayLogo = (): void => {
  const logo = figlet.textSync("CCHighway", {
    font: "Standard",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log(chalk.cyan(logo));
  console.log(chalk.gray("Claude Code Highway - Wrapper Tool\\n"));
};

export const displayVersion = (): string => {
  try {
    const packageJsonPath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version: string;
    };
    return packageJson.version;
  } catch {
    return "1.0.0";
  }
};

export const displaySuccessBox = (title: string, message: string): void => {
  const content = chalk.green(`✓ ${title}\\n\\n${message}`);

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
    })
  );
};

export const displayErrorBox = (title: string, message: string): void => {
  const content = chalk.red(`✗ ${title}\\n\\n${message}`);

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    })
  );
};

export const displayInfoBox = (title: string, message: string): void => {
  const content = chalk.blue(`ℹ ${title}\\n\\n${message}`);

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    })
  );
};

export const displayWarningBox = (title: string, message: string): void => {
  const content = chalk.yellow(`⚠ ${title}\\n\\n${message}`);

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "yellow",
    })
  );
};
