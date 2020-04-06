import {versionCheck} from "./common/util";
import {ROUTES_VERSION} from "./config";
import {GLOBAL_ENTRY_KEY, ValoryGlobalData} from "./common/compiler-headers";

export function loadGlobalData(): ValoryGlobalData {
    const data: ValoryGlobalData = (global as any)[GLOBAL_ENTRY_KEY];
    if (data == null) {
        throw Error("Could not retrieve generated data");
    }
    versionCheck("Routes", data.routes.routesVersion, ROUTES_VERSION);

    return data;
}
