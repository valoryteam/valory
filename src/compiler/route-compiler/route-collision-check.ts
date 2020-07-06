import {OpenAPIV3} from "openapi-types";
import {HttpMethodsLowercase} from "../../lib/common/headers";

const pathReplacer = /{([\S]*?)}/g;

export function routeCollisionCheck(spec: OpenAPIV3.Document) {
    const collisionMap = Object.entries(spec.paths)
        .map(([path, op]) => {
            const pathMethodSet = [];
            for (const method of HttpMethodsLowercase) {
                if (op[method] != null) {
                    pathMethodSet.push(`${path}:${method}`);
                }
            }
            return pathMethodSet;
        })
        .flat()
        .reduce((col, path) => {
            const norm = normalizePath(path);
            col[norm] = [...(col[norm] ?? []), path];
            return col;
        }, {} as { [normPath: string]: string[] });

    Object.values(collisionMap).forEach((value) => {
        if (value.length > 1) {
            throw new Error(`Path collision: Overlapping paths specified [${value}]`);
        }
    });
}

export function normalizePath(path: string) {
    let index = 0;
    return path.replace(pathReplacer, () => {
        return `{${index++}}`;
    });
}
