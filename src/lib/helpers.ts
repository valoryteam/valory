import {createHash} from "crypto";

type SteedErrorCallback<T> = (err?: T) => void;
type SteedIterator<T, E> = (item: T, callback: SteedErrorCallback<E>) => void;
type eachSeries = <T, E>(context: any, iterator: SteedIterator<T, E>, arr: T[] | {[key: string]: T}, callback: SteedErrorCallback<E>) => void;

export const eachSeries = require("fastseries")({results: false}) as eachSeries;

export function sha1String(data: string | Buffer): string {
	return createHash("sha1").update(data).digest("hex");
}

export function sha1Buffer(data: string | Buffer): Buffer {
	return createHash("sha1").update(data).digest();
}

const MS_PER_SEC = 1000;
const NS_PER_MS = 1e6;
let UUID_COUNTER = 0;
const UUID_BASE = sha1String(Math.random().toString());

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

export function fastOmit<T extends {[key: string]: any}, K extends keyof T>(object: T, keys: K[]): T {
	const result = {} as any;
	for (const i in object) {
		if (keys.indexOf(i as any) >= 0) { continue; }
		if (!Object.prototype.hasOwnProperty.call(object, i)) { continue; }
		result[i] = object[i];
	}
	return result;
}

export function fastUUID() {
	return `${UUID_BASE}#${++UUID_COUNTER}`;
}
