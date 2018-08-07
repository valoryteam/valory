import { CompilerOutput, ICompilerOptions } from "./compilerheaders";
import Pino = require("pino");
import { Swagger } from "../server/swagger";
export declare const CompileLog: Pino.Logger;
export declare const DisallowedFormats: string[];
export declare function compile(spec: Swagger.Spec, options?: ICompilerOptions): Promise<CompilerOutput>;
