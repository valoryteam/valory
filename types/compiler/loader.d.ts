import { Swagger } from "../server/swagger";
import { ValidatorModule } from "./compilerheaders";
export declare function loadModule(definitions: {
    [x: string]: Swagger.Schema;
}): ValidatorModule;
