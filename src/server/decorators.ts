import {ApiMiddleware} from "./valoryheaders";
import {Controller} from "./controller";
import {Swagger} from "./swagger";

// export function Example<T>(exampleModel: T): any {
// 	return () => {
// 		return;
// 	};
// }

/**
 * Register GET endpoint
 * @param {string} name local route for endpoint
 */
export function Get(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Register POST endpoint
 * @param {string} name local route for endpoint
 */
export function Post(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Register PUT endpoint
 * @param {string} name local route for endpoint
 * @constructor
 */
export function Put(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Register PATCH endpoint
 * @param {string} name local route for endpoint
 */
export function Patch(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Register DELETE endpoint
 * @param {string} name local route for endpoint
 */
export function Delete(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Add a middleware to a controller or route
 * @param {ApiMiddleware} middleware
 */
export function Middleware(middleware: ApiMiddleware): any {
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

/**
 * Add a post middleware to a controller or route
 * @param {ApiMiddleware} middleware
 */
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

// export function ReferenceParameters(parameters: Swagger.RefParameter[]): any {
// 	return () => { return; };
// }

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
