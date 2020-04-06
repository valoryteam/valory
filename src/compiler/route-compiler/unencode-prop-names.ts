const mapKeysDeep = require("map-keys-deep-lodash");

export function unencodePropNames<T>(obj: T): T {
    return mapKeysDeep(obj, (value: string, key: string) => {
        return decodeURIComponent(key);
    });
}
