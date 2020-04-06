import {OpenAPIV3} from "openapi-types";
import {createHash} from "crypto";

export interface Map<T> {
    [key: string]: T;
}

export function isReferenceObject(input: any): input is OpenAPIV3.ReferenceObject {
    return (typeof input.$ref === "string");
}


export function sha1String(data: string | Buffer): string {
    return createHash("sha1").update(data).digest("hex");
}

export function sha1Buffer(data: string | Buffer): Buffer {
    return createHash("sha1").update(data).digest();
}

export function versionCheck(title: string, required: number, actual: number) {
    if (required !== actual) {
        throw Error(`${title} version mismatch. required: ${required} actual: ${actual}`);
    }
}

export function memoizeSingle<T>(fn: ()=>T): ()=>T {
    let cache: T | null = null;
    return () => {
        if (cache == null) {cache = fn();}
        return cache;
    };
}

export function arrayPush<T>(target?: T[], other?: T[]): T[] {
    if (other == null || other.length === 0) {
        return target;
    }

    // Pre allocate
    const originalTargetLength = target.length;
    const otherLength = other.length;
    target.length = originalTargetLength + otherLength;

    for (let i = 0; i < otherLength; i++) {
        target[originalTargetLength + i] = other[i];
    }
    return target;
}

export function lowercaseKeys(obj: {[key: string]: unknown}) {
    const keys = Object.keys(obj);
    const n = keys.length;
    for (let i =0; i<n;i++) {
        const key = keys[i];
        const val = obj[key];
        delete obj[key];
        obj[key.toLowerCase()] = val;
    }
    return obj;
}
