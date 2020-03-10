import {ApiMiddleware} from "../lib/common/middleware";

export {
    Response,
    Path,
    Request,
    Get,
    Route,
    Patch,
    Body,
    Put,
    Delete,
    Query,
    Header,
    Post,
    BodyProp,
    Example,
    Head,
    OperationId,
    Security,
    SuccessResponse,
    Tags
} from "tsoa"

/**
 * Prepend a middleware to a controller or route
 * @Decorator
 * @param {ApiMiddleware} middleware
 */
export function PrependMiddleware(middleware: ApiMiddleware): any {
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
 * Append a middleware to a controller or route
 * @Decorator
 * @param {ApiMiddleware} middleware
 */
export function AppendMiddleware(middleware: ApiMiddleware): any {
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
