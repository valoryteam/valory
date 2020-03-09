import {ValidatorModule} from "./common/compiler-headers";
import {ModuleBuilder} from "../compiler/module/module-builder";

export interface ValoryGlobalData {
    validation: ValidatorModule;
}

export const GLOBAL_ENTRY_KEY = "VALORY_DATA";

export function saveGlobalDataBlank(outputDirectory: string) {
    const builder = new ModuleBuilder({
       modules: {},
       destinationPath: outputDirectory,
       globalVar: GLOBAL_ENTRY_KEY,
    });
    builder.generate();
}

export function saveGlobalData(data: {[P in keyof ValoryGlobalData]: string}, outputDirectory: string) {
    const builder = new ModuleBuilder({
        modules: data,
        destinationPath: outputDirectory,
        globalVar: GLOBAL_ENTRY_KEY,
    });
    builder.generate();
}

export function loadGlobalData(): ValoryGlobalData {
    if ((global as any)[GLOBAL_ENTRY_KEY] == null) {
        throw Error("Could not retrieve generated data")
    }
    return (global as any)[GLOBAL_ENTRY_KEY]
}
