import { RequestFieldMap } from "./compilerheaders";
import { Swagger } from "../server/swagger";
export interface MethodOutput {
    schema: Swagger.Schema;
    hash: string;
}
export declare function compileMethodSchema(operation: Swagger.Operation, method: string, pathName: string, requestObjectMap: RequestFieldMap): Swagger.Schema;
