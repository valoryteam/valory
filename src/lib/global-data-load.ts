import {versionCheck} from "./common/util";
import {ValoryGlobalData} from "./common/compiler-headers";
import {GLOBAL_ENTRY_KEY, ROUTES_VERSION} from "./common/headers";

export function loadGlobalData(): ValoryGlobalData {
    const data: ValoryGlobalData = (global as any)[GLOBAL_ENTRY_KEY];
    if (data == null) {
        throw Error("Could not retrieve generated data");
    }
    versionCheck("Routes", data.routes.routesVersion, ROUTES_VERSION);

    return data;
}
