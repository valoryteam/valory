import {ThreadSpinner} from "thread-spin";
import chalk = require("chalk");

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

export async function spinnerWrap<T>(value: Promise<T> | T | (() => Promise<T> | T), text: string, textSuccess: string = text, textFailure: string = `Failed: ${text}`): Promise<T> {
    try {
        let result;
        await Spinner.start(text);
        if (typeof value === "function") {
            result = await (value as ()=>T)();
        } else {
            result = await value;
        }
        await Spinner.succeed(textSuccess);
        return result;
    } catch (e) {
        await spinnerFail(textFailure, e, true);
        throw e;
    }
}
