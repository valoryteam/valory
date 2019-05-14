import {ThreadSpinner} from "thread-spin";
import chalk from "chalk";
export const Spinner = new ThreadSpinner(undefined, process.env.NODE_ENV === "test", true);

export async function spinnerFail(message: string, e: any, die: boolean = true, time = false) {
	await Spinner.fail(chalk.red.bold(message + "\n"), time);
	ThreadSpinner.shutdown();
	if (e != null) {
        console.error(e);
    }
	if (die) {
		process.exit(1);
	}
}
