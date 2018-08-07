import { ApiResponse, ApiServer, HttpMethod, ValoryMetadata, ApiRequest } from "../main";
export declare class DefaultAdaptor implements ApiServer {
    readonly locallyRunnable: boolean;
    readonly allowDocSite: boolean;
    private instance;
    constructor();
    register(path: string, method: HttpMethod, handler: (request: ApiRequest) => ApiResponse | Promise<ApiResponse>): void;
    getExport(metadata: ValoryMetadata, options: any): {
        valory: ValoryMetadata;
    };
    shutdown(): void;
}
