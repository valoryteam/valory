import {ApiContext} from "./context";
import {OpenAPIV3} from "openapi-types";

export type ApiMiddlewareExecutor = (ctx: ApiContext) => Promise<void> | void;

export interface ApiMiddleware {
    handler: ApiMiddlewareExecutor;
    readonly name: string;
    readonly tags?: OpenAPIV3.TagObject[];
}
