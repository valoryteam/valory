import { Swagger } from "../server/swagger";
import { ICompilerOptions } from "./compilerheaders";
export declare function compileAndSave(swagger: Swagger.Spec, compilePath: string, additionalPath: string, undocumentedPaths: string[], compilerOptions: ICompilerOptions, debugPath?: string): Promise<void>;
