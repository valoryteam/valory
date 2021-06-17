import {HttpMethodsLowercase} from "../../main";
import {OpenAPIV3} from "openapi-types";
import {dereference} from "swagger-parser";
import {cloneDeep,} from "lodash";
import {Swagger} from "@tsoa/runtime";

export async function updateResponseContentType(spec: Swagger.Spec3): Promise<Swagger.Spec3> {
    const derefSpec = await dereference(cloneDeep(spec as unknown as OpenAPIV3.Document));
    const paths = Object.keys(derefSpec.paths);
    for (const path of paths) {
        HttpMethodsLowercase.forEach((method) => {
           const operation = derefSpec.paths[path][method];
           if (operation?.responses == null) {
               return;
           }
           const responseCodes = Object.keys(operation.responses);
           for (const responseCode of responseCodes) {
               const response = operation.responses[responseCode] as OpenAPIV3.ResponseObject;
               const headers = (response).headers;
               const contentType = ((headers?.["Content-Type"] as OpenAPIV3.HeaderObject)?.schema as OpenAPIV3.SchemaObject)?.enum?.[0] ??
                   ((headers?.["content-type"] as OpenAPIV3.HeaderObject)?.schema as OpenAPIV3.SchemaObject)?.enum?.[0];
               const contentResponseTypes = Object.keys(response.content);
               if (contentResponseTypes.length > 1) {
                   continue;
               }
               const existingContentType = contentResponseTypes[0];
               const existingResponseContent = (spec.paths[path][method].responses[responseCode] as OpenAPIV3.ResponseObject).content;
               existingResponseContent[contentType] = existingResponseContent[existingContentType];
               delete existingResponseContent[existingContentType];
           }
        });
    }
    return spec;
}
