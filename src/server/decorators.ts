import {Controller} from "./controller";
import {ApiMiddleware} from "../lib/common/headers";

export function SuccessResponse<HeaderType extends IsValidHeader<HeaderType> = {}>(name: string | number, description?: string): any {
    return (target: any, propertyKey?: string) => {
        if (propertyKey == null) { return; }
        if (typeof name !== "number") { return; }
        target[propertyKey].statusCode = name;
    };
}

export function Response<ExampleType, HeaderType extends IsValidHeader<HeaderType> = {}>(name: string | number, description?: string, example?: ExampleType): any {
    return () => {
        return;
    };
}

/**
 * used to show a method as deprecated on swagger documentation
 */
export function Deprecated(): any {
    return () => {
        return;
    };
}

export function Example<T>(exampleModel: T): any {
    return () => {
        return;
    };
}

export function Head(value?: string): any {
    return () => {
        return;
    };
}

export function Extension(_name: string, _value: ExtensionType | ExtensionType[]): () => void {
    return () => {
        return;
    };
}

export type ExtensionType = string | { [name: string]: ExtensionType | ExtensionType[] };

export function OperationId(value: string): any {
    return () => {
        return;
    };
}

export function NoSecurity(): any {
    return () => {
        return;
    };
}

/**
 * @param {name} security name from securityDefinitions
 */
export function Security(name: string | { [name: string]: string[] }, scopes?: string[]): any {
    return () => {
        return;
    };
}


/**
 * Prepend a middleware to a controller or route
 * @Decorator
 * @param {ApiMiddleware} middleware
 */
export function PrependMiddleware(...middleware: ApiMiddleware[]): any {
    return (target: any, propertyKey?: string) => {
        if (propertyKey != null) {
            target = target[propertyKey];
        } else {
            target = target.prototype;
        }
        if (target.middleware == null) {
            target.middleware = [];
        }
        target.middleware = [...middleware, ...target.middleware];
    };
}

/**
 * Append a middleware to a controller or route
 * @Decorator
 * @param {ApiMiddleware} middleware
 */
export function AppendMiddleware(...middleware: ApiMiddleware[]): any {
    return (target: any, propertyKey?: string) => {
        if (propertyKey != null) {
            target = target[propertyKey];
        } else {
            target = target.prototype;
        }
        if (target.postMiddleware == null) {
            target.postMiddleware = [];
        }
        target.postMiddleware = [...target.postMiddleware, ...middleware];
    };
}

/**
 * Register a GET endpoint
 * @Decorator
 * @param {string} name local route for endpoint
 */
export function Get(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Register a POST endpoint
 * @Decorator
 * @param {string} name local route for endpoint
 */
export function Post(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Register a PUT endpoint
 * @Decorator
 * @param {string} name local route for endpoint
 */
export function Put(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Register a PATCH endpoint
 * @Decorator
 * @param {string} name local route for endpoint
 */
export function Patch(name?: string): any {
    return () => {
        return;
    };
}

export function Options(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Register a DELETE endpoint
 * @Decorator
 * @param {string} name local route for endpoint
 */
export function Delete(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Inject the http body into an argument.
 * @Decorator
 */
export function Body(): any {
    return () => {
        return;
    };
}

/**
 * Inject value of a property in the http body into an argument. Uses argument name by default.
 * @Decorator
 * @param {string} name The name of the body parameter
 */
export function BodyProp(name?: string): any {
    return () => {
        return;
    };
}

/**
 * Inject the raw request object into an argument. Useful if you need to access attachments.
 * @Decorator
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

/**
 * Labels a class as a route controller
 * @Decorator
 * @param {string} name The path prefix for this controller
 */
export function Route(name?: string): any {
    return (target: Controller) => {
        return;
    };
}

/**
 * Can be used to entirely hide an method from documentation.
 * @Decorator
 */
export function Hidden(): any {
    return () => {
        return;
    };
}

/**
 * Adds a given set of tags to either an endpoint or controller
 * @Decorator
 */
export function Tags(...values: string[]): any {
    return () => {
        return;
    };
}

export type IsValidHeader<HeaderValue> = keyof HeaderValue extends string | number
    ? HeaderValue[keyof HeaderValue] extends string | string[] | undefined
        ? {}
        : 'Header values must be string or string[]'
    : 'Header names must be of type string';
