const mapKeysDeep = require("map-keys-deep-lodash");

export function oneOfToAnyOf<T>(obj: T): T {
    return mapKeysDeep(obj, (value: string, key: string) => {
        if (key === "oneOf") {return 'anyOf';} else {return key;}
    });
}
