import {OpenAPIV3} from "openapi-types";
import {HttpMethodsLowercase, uppercaseHttpMethod} from "../../lib/common/headers";

export interface CORSData {
    path: string;
    allowedHeaders: string[];
    allowedMethods: string[];
}

export function generateCORSData(spec: OpenAPIV3.Document, allowedHeaders: string[]): CORSData[] {
    return Object.entries(spec.paths).map(([path, methods]) => {
        const methodSet: Set<string> = new Set();
        const headerSet = new Set(["Content-Type"].concat(allowedHeaders));
        HttpMethodsLowercase.forEach((method) => {
            const operation = methods[method];
            if (operation == null) {
                return null;
            }
            methodSet.add(uppercaseHttpMethod(method));
        });
        return {
            path, allowedHeaders: [...headerSet], allowedMethods: [...methodSet]
        };
    });
}
