import {Aigle} from "aigle";

declare global {
	type IterateFunction<T, R> = (item: T, index: number, arrayLength: number) => (R | PromiseLike<R>);
	/*
	 * Patch all instance method
	 */
	interface Promise<T> {
		all(this: Promise<Iterable<{}>>): Aigle<T>;
		all(): Aigle<never>;
		any<Q>(this: Promise<T & Iterable<Q>>): Aigle<Q>;
		any(): Aigle<never>;
		cancel: Aigle<T>["cancel"];
		// catch: Aigle<T>["catch"]; // Provided by lib.es5.d.ts
		delay: Aigle<T>["delay"];
		disposer: Aigle<T>["disposer"];
		each<Q>(this: Promise<T & Iterable<Q>>, iterator: IterateFunction<Q, any>): Aigle<T>;
		filter<Q>(this: Promise<T & Iterable<Q>>, filterer: IterateFunction<Q, boolean>): Aigle<T>;
		// finally: Aigle<T>["finally"]; // Provided by lib.es2018.promise.d.ts
		isCancelled: Aigle<T>["isCancelled"];
		isFulfilled: Aigle<T>["isFulfilled"];
		isPending: Aigle<T>["isPending"];
		isRejected: Aigle<T>["isRejected"];
		map<U, Q>(this: Promise<T & Iterable<Q>>, mapper: IterateFunction<Q, U>): Aigle<U[]>;
		mapSeries<U, Q>(this: Promise<T & Iterable<Q>>, iterator: IterateFunction<Q, U>): Aigle<U[]>;
		props: Aigle<T>["props"];
		race<Q>(this: Promise<T & Iterable<Q>>): Aigle<Q>;
		race(): Aigle<never>;
		reason: Aigle<T>["reason"];
		reduce<U, Q>(this: Promise<T & Iterable<Q>>, reducer: (memo: U, item: Q, index: number, arrayLength: number) => (U | PromiseLike<U>), initialValue?: U): Aigle<U>;
		some(this: Promise<Iterable<{}>>, count: number): Aigle<T>;
		spread<U, Q>(this: Aigle<T & Iterable<Q>>, fulfilledHandler: (...values: Q[]) => (U | PromiseLike<U>)): Aigle<U>;
		suppressUnhandledRejections: Aigle<T>["suppressUnhandledRejections"];
		tap: Aigle<T>["tap"];
		// then: Aigle<T>["then"]; // Provided by lib.es5.d.ts
		timeout: Aigle<T>["timeout"];
		toString: Aigle<T>["toString"];
		value: Aigle<T>["value"];

		/*
		 * Copy&paste ::then and ::catch from lib.es5.promise.d.ts, because Aigle's typings are not
		 * in line with the standard lib.
		 *
		 * #std-lib-copy&paste-to-remove
		 *
		 * @todo See the comment near the top of the file about code marked with #std-lib-copy&paste-to-remove
		 */
		then<TResult1 = T, TResult2 = never>(
			onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
			onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
		): Promise<TResult1 | TResult2>;
		catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;

		/*
		 * TypeScript disallows adding overrides via `catch: typeof Aigle.prototype.catch`. Copy&paste them then.
		 *
		 * @todo Duplication of code is never ideal. See whether there's a better way of achieving this.
		 */
		catch(predicate: (error: any) => boolean, onReject: (error: any) => T | PromiseLike<T> | void | PromiseLike<void>): Aigle<T>;
		catch<U>(predicate: (error: any) => boolean, onReject: (error: any) => U | PromiseLike<U>): Aigle<U | T>;
		catch<E extends Error>(ErrorClass: new (...args: any[]) => E, onReject: (error: E) => T | PromiseLike<T> | void | PromiseLike<void>): Aigle<T>;
		catch<E extends Error, U>(ErrorClass: new (...args: any[]) => E, onReject: (error: E) => U | PromiseLike<U>): Aigle<U | T>;
		// tslint:disable-next-line:unified-signatures
		catch(predicate: object, onReject: (error: any) => T | PromiseLike<T> | void | PromiseLike<void>): Aigle<T>;
		// tslint:disable-next-line:unified-signatures
		catch<U>(predicate: object, onReject: (error: any) => U | PromiseLike<U>): Aigle<U | T>;

		/*
		 * See comments above `then` for the reason why this is needed. Taken from es2018.promise.d.ts.
		 *
		 * #std-lib-copy&paste-to-remove
		 *
		 * @todo See the comment near the top of the file about code marked with #std-lib-copy&paste-to-remove
		 */
		finally(onfinally?: (() => void) | undefined | null): Promise<T>;
	}

	/*
	 * Patch all static methods and the constructor
	 */
	interface PromiseConstructor {
		new <T>(callback: (resolve: (thenableOrResult?: T | PromiseLike<T>) => void, reject: (error?: any) => void, onCancel?: (callback: () => void) => void) => void): Promise<T>;

		// all: typeof Aigle.all; // Provided by lib.es2015.d.ts
		attempt: typeof Aigle.attempt;
		bind: typeof Aigle.bind;
		config: typeof Aigle.config;
		delay: typeof Aigle.delay;
		each: typeof Aigle.each;
		filter: typeof Aigle.filter;
		join: typeof Aigle.join;
		longStackTraces: typeof Aigle.longStackTraces;
		map: typeof Aigle.map;
		mapSeries: typeof Aigle.mapSeries;
		promisify: typeof Aigle.promisify;
		promisifyAll: typeof Aigle.promisifyAll;
		props: typeof Aigle.props;
		// race: typeof Aigle.race; // Provided by lib.es2015.d.ts
		reduce: typeof Aigle.reduce;
		// reject: typeof Aigle.reject; // Provided by lib.es2015.d.ts
		// resolve: typeof Aigle.resolve; // Provided by lib.es2015.d.ts
		some: typeof Aigle.some;
		using: typeof Aigle.using;

		/*
		 * Copy&paste from lib.es2015.promise.d.ts, because Aigle's typings are not in line with the standard lib.
		 *
		 * #std-lib-copy&paste-to-remove
		 *
		 * @todo See the comment near the top of the file about code marked with #std-lib-copy&paste-to-remove
		 */
		all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
		all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
		all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
		all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): Promise<[T1, T2, T3, T4, T5, T6, T7]>;
		all<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): Promise<[T1, T2, T3, T4, T5, T6]>;
		all<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>]): Promise<[T1, T2, T3, T4, T5]>;
		all<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>]): Promise<[T1, T2, T3, T4]>;
		all<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): Promise<[T1, T2, T3]>;
		all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Promise<[T1, T2]>;
		all<T>(values: Array<T | PromiseLike<T>>): Promise<T[]>;
		race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): Promise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
		race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): Promise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
		race<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): Promise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
		race<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): Promise<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
		race<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): Promise<T1 | T2 | T3 | T4 | T5 | T6>;
		race<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): Promise<T1 | T2 | T3 | T4 | T5>;
		race<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): Promise<T1 | T2 | T3 | T4>;
		race<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): Promise<T1 | T2 | T3>;
		race<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Promise<T1 | T2>;
		race<T>(values: Array<T | PromiseLike<T>>): Promise<T>;
		reject(reason: any): Promise<never>;
		reject<T>(reason: any): Promise<T>;
		resolve<T>(value: T | PromiseLike<T>): Promise<T>;
		resolve(): Promise<void>;
	}

	/*
	 * Declare the `Promise` variable. This is needed for es5 only and is a no-op for all other targets.
	 *
	 * #std-lib-copy&paste-to-remove
	 *
	 * @todo See the comment near the top of the file about code marked with #std-lib-copy&paste-to-remove
	 */
	var Promise: PromiseConstructor;
}
