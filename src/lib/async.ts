// tslint:disable
const obj = "object";
const func = "function";
const isArray = Array.isArray;
const nativeKeys = Object.keys;
const nativePush = Array.prototype.push;
const iteratorSymbol = typeof Symbol === func && Symbol.iterator;
// tslint:disable-next-line:one-variable-per-declaration
let nextTick: typeof process.nextTick, asyncNextTick, asyncSetImmediate;
createImmediate(false);

export interface Dictionary<T> { [key: string]: T; }
export type IterableCollection<T> = T[] | IterableIterator<T> | Dictionary<T>;

export type ErrorCallback<E = Error> = (err?: E | null) => void;
export type AsyncBooleanResultCallback<E = Error> = (err?: E | null, truthValue?: boolean) => void;
export type AsyncResultCallback<T, E = Error> = (err?: E | null, result?: T) => void;
export type AsyncResultArrayCallback<T, E = Error> = (err?: E | null, results?: Array<T | undefined>) => void;
export type AsyncResultObjectCallback<T, E = Error> = (err: E | undefined, results: Dictionary<T | undefined>) => void;

export type AsyncFunction<T, E = Error> = (callback: (err?: E | null, result?: T) => void) => void;
export type AsyncFunctionEx<T, E = Error> = (callback: (err?: E | null, ...results: T[]) => void) => void;
export type AsyncIterator<T, E = Error> = (item: T, callback: ErrorCallback<E>) => void;
export type AsyncForEachOfIterator<T, E = Error> = (item: T, key: number|string, callback: ErrorCallback<E>) => void;
export type AsyncResultIterator<T, R, E = Error> = (item: T, callback: AsyncResultCallback<R, E>) => void;
export type AsyncMemoIterator<T, R, E = Error> = (memo: R | undefined, item: T, callback: AsyncResultCallback<R, E>) => void;
export type AsyncBooleanIterator<T, E = Error> = (item: T, callback: AsyncBooleanResultCallback<E>) => void;

export type AsyncWorker<T, E = Error> = (task: T, callback: ErrorCallback<E>) => void;
export type AsyncVoidFunction<E = Error> = (callback: ErrorCallback<E>) => void;

export type AsyncAutoTasks<R extends Dictionary<any>, E> = { [K in keyof R]: AsyncAutoTask<R[K], R, E> };
export type AsyncAutoTask<R1, R extends Dictionary<any>, E> = AsyncAutoTaskFunctionWithoutDependencies<R1, E> | Array<keyof R | AsyncAutoTaskFunction<R1, R, E>>;
export type AsyncAutoTaskFunctionWithoutDependencies<R1, E = Error> = (cb: AsyncResultCallback<R1, E> | ErrorCallback<E>) => void;
export type AsyncAutoTaskFunction<R1, R extends Dictionary<any>, E = Error> = (results: R, cb: AsyncResultCallback<R1, E> | ErrorCallback<E>) => void;

function createImmediate(safeMode: boolean) {
	// tslint:disable-next-line:no-shadowed-variable
	const delay = function delay(fn: () => void) {
		const args = slice(arguments as any, 1) as any[];
		setTimeout(function() {
			fn.apply(null, args);
		});
	};
	asyncSetImmediate = typeof setImmediate === func ? setImmediate : delay;
	if (typeof process === obj && typeof process.nextTick === func) {
		nextTick = /^v0.10/.test(process.version) ? asyncSetImmediate : process.nextTick;
		asyncNextTick = /^v0/.test(process.version) ? asyncSetImmediate : process.nextTick;
	} else {
		asyncNextTick = nextTick = asyncSetImmediate;
	}
	if (safeMode === false) {
		nextTick = function(cb: () => void) {
			cb();
		};
	}
}

// tslint:disable-next-line:ban-types
export function compose(...fns: Function[]): Function {
	return seq.apply(null, reverse(arguments as any));
}

export function seq(/* functions... */) {
	const fns = createArray(arguments as any) as Function[];

	return function() {
		const self = this;
		const args = createArray(arguments as any);
		let callback = args[args.length - 1] as Function;
		if (typeof callback === func) {
			args.pop();
		} else {
			callback = noop;
		}
		reduce(fns, args, iterator, done);

		// tslint:disable-next-line:no-shadowed-variable
		function iterator(newargs: any[], fn: () => void, callback: (err: any, args: any[]) => void) {
			// tslint:disable-next-line:no-shadowed-variable
			const func = function(err: any) {
				const nextargs = slice(arguments as any, 1);
				callback(err, nextargs);
			};
			newargs.push(func);
			fn.apply(self, newargs);
		}

		function done(err: any, res: any) {
			res = isArray(res) ? res : [res];
			res.unshift(err);
			callback.apply(self, res);
		}
	};
}

function reduce<T, R, E = Error>(collection: T[], result: R, iterator: AsyncIterator<T, E>, callback?: AsyncResultCallback<R, E>) {
	callback = onlyOnce(callback || noop);
	let size: number, key: string, keys: string[], iter: any, item, iterate: any;
	let sync = false;
	let completed = 0;

	if (Array.isArray(collection)) {
		size = collection.length;
		iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
		// tslint:disable-next-line:no-empty
	} else if (!collection) {
	} else if (iteratorSymbol && collection[iteratorSymbol]) {
		size = Infinity;
		iter = (collection[iteratorSymbol as any] as any)();
		iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
	} else if (typeof collection === obj) {
		keys = Object.keys(collection);
		size = keys.length;
		iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
	}
	if (!size) {
		return callback(null, result);
	}
	iterate(result);

	function arrayIterator(result: R) {
		iterator(result, collection[completed], done);
	}

	function arrayIteratorWithIndex(result: R) {
		iterator(result, collection[completed], completed, done);
	}

	function symbolIterator(result: R) {
		item = iter.next();
		item.done ? callback(null, result) : iterator(result, item.value, done);
	}

	function symbolIteratorWithKey(result: R) {
		item = iter.next();
		item.done ? callback(null, result) : iterator(result, item.value, completed, done);
	}

	function objectIterator(result: R) {
		iterator(result, collection[keys[completed] as any], done);
	}

	function objectIteratorWithKey(result: R) {
		key = keys[completed];
		iterator(result, collection[key as any], key, done);
	}

	function done(err: any, result: R) {
		if (err) {
			callback(err, result);
		} else if (++completed === size) {
			iterator = throwError;
			callback(null, result);
		} else if (sync) {
			process.nextTick(function() {
				iterate(result);
			});
		} else {
			sync = true;
			iterate(result);
		}
		sync = false;
	}
}

export function eachSeries<T, E = Error>(collection: IterableCollection<T>, iterator: AsyncIterator<T, E>, callback?: ErrorCallback<E>) {
	callback = onlyOnce(callback || noop) as any;
	let size: number, key: string, keys: string[], iter: any, item, iterate: any;
	let sync = false;
	let completed = 0;

	if (isArray(collection)) {
		size = collection.length;
		iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
	} else if (!collection) {
	} else if (iteratorSymbol && (collection as any)[iteratorSymbol]) {
		size = Infinity;
		iter = (collection as any)[iteratorSymbol]();
		iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
	} else if (typeof collection === obj) {
		keys = nativeKeys(collection);
		size = keys.length;
		iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
	}
	if (!size) {
		return callback(null);
	}
	iterate();

	function arrayIterator() {
		iterator((collection as any)[completed], done);
	}

	function arrayIteratorWithIndex() {
		iterator((collection as any)[completed], completed, done);
	}

	function symbolIterator() {
		item = iter.next();
		item.done ? callback(null) : iterator(item.value, done);
	}

	function symbolIteratorWithKey() {
		item = iter.next();
		item.done ? callback(null) : iterator(item.value, completed, done);
	}

	function objectIterator() {
		iterator((collection as any)[keys[completed]], done);
	}

	function objectIteratorWithKey() {
		key = keys[completed];
		iterator((collection as any)[key], key, done);
	}

	function done(err: any, bool: boolean) {
		if (err) {
			callback(err);
		} else if (++completed === size || bool === false) {
			iterate = throwError;
			callback(null);
		} else if (sync) {
			nextTick(iterate);
		} else {
			sync = true;
			iterate();
		}
		sync = false;
	}
}

export function createArray<T>(array: T[]): T[] {
	let index = -1;
	const size = array.length;
	const result = Array(size);

	while (++index < size) {
		result[index] = array[index];
	}
	return result;
}

function noop(data: any) {
	return data;
}

// tslint:disable-next-line:no-shadowed-variable
function onlyOnce(func: (err: any, res: any) => void) {
	return function(err: any, res: any) {
		const fn = func;
		func = throwError;
		fn(err, res);
	};
}

function reverse<T>(array: T[]) {
	let index = -1;
	const size = array.length;
	const result = Array(size);
	let resIndex = size;

	while (++index < size) {
		result[--resIndex] = array[index];
	}
	return result;
}

function throwError() {
	throw new Error("Callback was already called.");
}

function slice<T>(array: T[], start: number): T[] {
	const end = array.length;
	let index = -1;
	const size = end - start;
	if (size <= 0) {
		return [];
	}
	const result = Array(size);

	while (++index < size) {
		result[index] = array[index + start];
	}
	return result;
}
