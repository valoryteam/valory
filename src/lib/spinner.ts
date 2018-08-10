import {ThreadSpinner} from "thread-spin";
import chalk from "chalk";
export const Spinner = new ThreadSpinner(undefined, process.env.NODE_ENV === "test");

export async function spinnerFail(message: string, e: any) {
	await Spinner.fail(chalk.red.bold(message + "\n"));
	ThreadSpinner.shutdown();
	console.error(e);
	process.exit(1);
}
