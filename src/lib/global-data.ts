import {RoutesModule, ValidatorModule} from "./common/compiler-headers";
import {ModuleBuilder} from "../compiler/module/module-builder";
import {ROUTES_VERSION} from "./config";
import {versionCheck} from "./common/util";

export interface ValoryGlobalData {
    validation: ValidatorModule;
    routes: RoutesModule;
}

export const GLOBAL_ENTRY_KEY = "VALORY_DATA";

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

export function loadGlobalData(): ValoryGlobalData {
    const data: ValoryGlobalData = (global as any)[GLOBAL_ENTRY_KEY];
    if (data == null) {
        throw Error("Could not retrieve generated data")
    }
    versionCheck("Routes", data.routes.routesVersion, ROUTES_VERSION);

    return data
}
