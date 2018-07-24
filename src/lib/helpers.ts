import {ThreadSpinner} from "thread-spin";
import chalk from "chalk";
import {Config} from "./config";

const MS_PER_SEC = 1000;
const NS_PER_MS = 1e6;

export function fastConcat<T>(...arrays: T[][]): T[] {
	const length = arguments.length;
	const arr = [];
	let i;
	let item;
	let childLength;
	let j;

	for (i = 0; i < length; i++) {
		item = arguments[i];
		if (Array.isArray(item)) {
			childLength = item.length;
			for (j = 0; j < childLength; j++) {
				arr.push(item[j]);
			}
		} else {
			arr.push(item);
		}
	}
	return arr;
}

export function fastForEach<T>(subject: T[], fn: (item: T, index: number, subject: T[]) => void, thisContext: any) {
	const length = subject.length;
	const iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn;
	let i;
	for (i = 0; i < length; i++) {
		iterator(subject[i], i, subject);
	}
}

export function bindInternal3<A, B, C>(func: (a: A, b: B, c: C) => any, thisContext: any) {
	return (a: A, b: B, c: C) => {
		return func.call(thisContext, a, b, c);
	};
}

export function convertTime(time: [number, number]): number {
	return time[0] * MS_PER_SEC + time[1] / NS_PER_MS;
}

export async function spinnerFail(message: string, e: any) {
	await Config.Spinner.fail(chalk.red.bold(message + "\n"));
	ThreadSpinner.shutdown();
	console.error(e);
	process.exit();
}