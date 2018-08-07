interface ApiError extends Error {
    valoryErrorCode: string;
    name: "ValoryEndpointError";
}
export declare const ApiError: (errorCode: string, message?: string) => ApiError;
export {};
