import {OpenAPIV2, OpenAPIV3} from "openapi-types";
import {HttpMethodsLowercase, uppercaseHttpMethod} from "../../lib/common/headers";
import {normalizePath} from "./route-collision-check";
import {merge, cloneDeep} from "lodash";

export interface CORSData {
    path: string;
    allowedHeaders: string[];
    allowedMethods: string[];
}

export function generateCORSData(spec: OpenAPIV3.Document, allowedHeaders: string[]): CORSData[] {
    const dedupedPaths = Object.entries(cloneDeep(spec.paths))
        .reduce((col, [path, op]) => {
            const norm = normalizePath(path);
            col[norm] = [...(col[norm] ?? []), op];
            return col;
        }, {} as { [path: string]: OpenAPIV3.PathItemObject[] });

    return Object.entries(dedupedPaths)
        .map(([path, ops]) => {
            const methods = merge(ops[0], ...ops);
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
