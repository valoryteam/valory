import {ApiMiddleware} from "./valoryheaders";
import {Controller} from "./controller";

/**
 * @Decorator
 * Register a GET endpoint
 * @param {string} name local route for endpoint
 */
export function Get(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Register a POST endpoint
 * @param {string} name local route for endpoint
 */
export function Post(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Register a PUT endpoint
 * @param {string} name local route for endpoint
 * @constructor
 */
export function Put(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Register a PATCH endpoint
 * @param {string} name local route for endpoint
 */
export function Patch(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Register a DELETE endpoint
 * @param {string} name local route for endpoint
 */
export function Delete(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
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
 * @Decorator
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
 * @Decorator
 * Inject the http body into an argument.
 */
export function Body(): any {
	return () => {
		return;
	};
}

/**
 *@Decorator
 * Inject value of a property in the http body into an argument. Uses argument name by default.
 * @param {string} name The name of the body parameter
 */
export function BodyProp(name?: string): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Inject the raw request object into an argument. Useful if you need to access attachments.
 */
export function Request(): any {
	return () => {
		return;
	};
}

/**
 * Inject a path parameter into an argument. Uses argument name by default.
 * @Decorator
 * @param {string} [name] The name of the path parameter
 */
export function Path(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject a query value into an argument. Uses argument name by default.
 * @Decorator
 * @param {string} [name] The name of the query parameter
 */
export function Query(name?: string): any {
	return () => {
		return;
	};
}

/**
 * Inject value from Http header
 * @Decorator
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
 * @Decorator
 * Disables static serializer for either a single endpoint or a controller.
 */
export function DisableSerialization(): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Inject request logger instance into an argument. Useful if you for some reason chose not to inherit from [[Controller]].
 */
export function Logger(): any {
	return () => {
		return;
	};
}

// export function SuccessResponse(name: string | number, description?: string): any {
// 	return () => {
// 		return;
// 	};
// }

/**
 * @Decorator
 * Add data about an additional response type.
 * @param name the status code used by this response
 * @param description
 * @param example
 */
export function Response(name: number, description?: string, example?: object): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Labels a class as a route controller
 * @param {string} name The path prefix for this controller
 */
export function Route(name?: string): any {
	return (target: Controller) => {

		return;
	};
}

/**
 * @Decorator
 * Can be used to entirely hide an method from documentation.
 */
export function Hidden(): any {
	return () => {
		return;
	};
}

/**
 * @Decorator
 * Adds a given set of tags to either an endpoint or controller
 */
export function Tags(...values: string[]): any {
	return () => {
		return;
	};
}
