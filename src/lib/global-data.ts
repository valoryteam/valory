import {ValoryGlobalData} from "./common/compiler-headers";
import {ModuleBuilder} from "../compiler/module/module-builder";
import {GLOBAL_ENTRY_KEY} from "./common/headers";

export function saveGlobalDataRoutesOnly(routes: string, outputDirectory: string) {
    const builder = new ModuleBuilder({
       modules: {routes},
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

