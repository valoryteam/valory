import {HttpMethod} from "./headers";
import {ApiContext} from "./context";

export interface ApiAdaptor {
    register(path: string, method: HttpMethod, handler: (ctx: ApiContext) => Promise<ApiContext>): void;

    /**
     * Startup underlying server
     */
    start(): any;
    shutdown(): void;
}
