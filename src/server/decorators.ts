import {ApiMiddleware} from "./valory";
import {Controller} from "./controller";

export function Example<T>(exampleModel: T): any {
	return () => {
		return;
	};
}

export function Get(value?: string): any {
	return () => {
		return;
	};
}

export function Post(value?: string): any {
	return () => {
		return;
	};
}

export function Put(value?: string): any {
	return () => {
		return;
	};
}

export function Patch(value?: string): any {
	return () => {
		return;
	};
}

export function Delete(value?: string): any {
	return () => {
		return;
	};
}

/**
 * Add a middleware to a controller or route
 * @param {ApiMiddleware} middleware
 * @constructor
 */
export function Middleware(middleware: ApiMiddleware) {
	return (target: any, propertyKey?: string) => {
		if (propertyKey != null) {
			target = target[propertyKey];
		} else {
			target = target.prototype;
		}
		if (target.middleware == null) {
			target.middleware = [];
		}
		target.middleware.push(middleware);
	};
}

export function PostMiddleware(middleware: ApiMiddleware): any {
	return (target: any, propertyKey?: string) => {
		if (propertyKey != null) {
			target = target[propertyKey];
		} else {
			target = target.prototype;
		}
		if (target.postMiddleware == null) {
			target.postMiddleware = [];
		}
		target.postMiddleware.push(middleware);
	};
}

/**
 * Inject http Body
 *  @param {string} [name] properties name in body object
 */
export function Body(): any {
	return () => {
		return;
	};
}

/**
 * Inject value from body
 *
 * @param {string} [name] The name of the body parameter
 */
export function BodyProp(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject http request
 */
export function Request(): any {
	return () => {
		return;
	};
}

/**
 * Inject value from Path
 *
 * @param {string} [name] The name of the path parameter
 */
export function Path(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject value from query string
 *
 * @param {string} [name] The name of the query parameter
 */
export function Query(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject value from Http header
 *
 * @param {string} [name] The name of the header parameter
 */
export function Header(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject request logger instance
 */
export function Logger(): any {
	return () => {
		return;
	};
}

export function SuccessResponse(name: string | number, description?: string): any {
	return () => {
		return;
	};
}

export function Response<T>(name: string | number, description?: string, example?: T): any {
	return () => {
		return;
	};
}

export function Route(name?: string): any {
	// console.log("route tag factory");
	return (target: Controller) => {
		// console.log("route tag evaluated");
		// console.log(target);
		// (target as any).prototype.middleware = [];
		// (target as any).prototype.postMiddleware = [];
		return;
	};
}

/**
 * can be used to entirely hide an method from documentation
 */
export function Hidden(): any {
	return () => {
		return;
	};
}

export function Tags(...values: string[]): any {
	return () => {
		return;
	};
}
