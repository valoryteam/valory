import { DiscriminatorMap, ExtendedSchema, MangledKey } from "./compilerheaders";
import { PriorityQueue } from "tstl";
import { Swagger } from "../server/swagger";
export interface OneOfMarker {
    depth: number;
    schema: ExtendedSchema;
}
export declare function swaggerPreproccess(swagger: Swagger.Spec): {
    swagger: Swagger.Spec;
    discriminators: DiscriminatorMap;
};
export declare function schemaPreprocess(schema: ExtendedSchema): {
    schema: ExtendedSchema;
    resQueue: PriorityQueue<OneOfMarker>;
};
export declare function resolve(resolveQueue: PriorityQueue<OneOfMarker>): void;
export declare function mangleKeys(schema: ExtendedSchema): {
    schema: ExtendedSchema;
    mangledKeys: MangledKey[];
};
