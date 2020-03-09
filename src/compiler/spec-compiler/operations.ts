import {OpenAPIV3} from "openapi-types";
import {HttpMethod, HttpMethodsLowercase, uppercaseHttpMethod} from "../../lib/common/headers";

export interface Operation {
    path: string;
    method: HttpMethod;
    operation: OpenAPIV3.OperationObject;
}

export function generateOperations(spec: OpenAPIV3.Document): Operation[] {
    return Object.entries(spec.paths).flatMap((value) => {
        const [path, methods] = value;
        return HttpMethodsLowercase.map((method) => {
            const operation = methods[method];
            if (operation == null) { return null }
            return {
                path, method: uppercaseHttpMethod(method), operation
            }
        }).filter(x=>x);
    })
}
