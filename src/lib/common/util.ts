import {OpenAPIV3} from "openapi-types";
import {createHash} from "crypto";

export interface Map<T> {
    [key: string]: T;
}

export function isReferenceObject(input: any): input is OpenAPIV3.ReferenceObject {
    return (typeof input.$ref === "string")
}


export function sha1String(data: string | Buffer): string {
    return createHash("sha1").update(data).digest("hex");
}

export function sha1Buffer(data: string | Buffer): Buffer {
    return createHash("sha1").update(data).digest();
}
