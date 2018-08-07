import { ApiMiddleware } from "./valoryheaders";
/**
 * Register GET endpoint
 * @param {string} name local route for endpoint
 */
export declare function Get(name?: string): any;
/**
 * Register POST endpoint
 * @param {string} name local route for endpoint
 */
export declare function Post(name?: string): any;
/**
 * Register PUT endpoint
 * @param {string} name local route for endpoint
 * @constructor
 */
export declare function Put(name?: string): any;
/**
 * Register PATCH endpoint
 * @param {string} name local route for endpoint
 */
export declare function Patch(name?: string): any;
/**
 * Register DELETE endpoint
 * @param {string} name local route for endpoint
 */
export declare function Delete(name?: string): any;
/**
 * Add a middleware to a controller or route
 * @param {ApiMiddleware} middleware
 */
export declare function Middleware(middleware: ApiMiddleware): any;
/**
 * Add a post middleware to a controller or route
 * @param {ApiMiddleware} middleware
 */
export declare function PostMiddleware(middleware: ApiMiddleware): any;
/**
 * Inject http Body
 *  @param {string} [name] properties name in body object
 */
export declare function Body(): any;
/**
 * Inject value from body
 *
 * @param {string} [name] The name of the body parameter
 */
export declare function BodyProp(name?: string): any;
/**
 * Inject http request
 */
export declare function Request(): any;
/**
 * Inject value from Path
 *
 * @param {string} [name] The name of the path parameter
 */
export declare function Path(name?: string): any;
/**
 * Inject value from query string
 *
 * @param {string} [name] The name of the query parameter
 */
export declare function Query(name?: string): any;
/**
 * Inject value from Http header
 *
 * @param {string} [name] The name of the header parameter
 */
export declare function Header(name?: string): any;
/**
 * Inject request logger instance
 */
export declare function Logger(): any;
export declare function SuccessResponse(name: string | number, description?: string): any;
export declare function Response<T>(name: string | number, description?: string, example?: T): any;
export declare function Route(name?: string): any;
/**
 * can be used to entirely hide an method from documentation
 */
export declare function Hidden(): any;
export declare function Tags(...values: string[]): any;
