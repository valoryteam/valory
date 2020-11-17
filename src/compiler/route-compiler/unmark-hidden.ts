import { Tsoa } from '@tsoa/runtime';
import { normalisePath } from '@tsoa/cli/dist/utils/pathUtils';
import {OpenAPIV3} from "openapi-types";
import {unset, cloneDeep, omitBy, isEmpty} from 'lodash';

export function unmarkHidden(metadata: Tsoa.Metadata): string[] {
    const hiddenPaths: string[] = [];
    for (const controller of metadata.controllers) {
        const normControllerPath = normalisePath(controller.path, '/');
        for (const method of controller.methods) {
            if (!method.isHidden) continue;
            method.isHidden = false;
            const normMethodPath = normalisePath(method.path, '/');
            const path = normalisePath(`${normControllerPath}${normMethodPath}`, '/', '', false);
            hiddenPaths.push(`${path}.${method.method}`);
        }
    }
    return hiddenPaths;
}

export function filterSpec(spec: OpenAPIV3.Document, hiddenPaths: string[]) {
    const filteredSpec = cloneDeep(spec);
    hiddenPaths.forEach(path => unset(filteredSpec.paths,path));
    filteredSpec.paths = omitBy(filteredSpec.paths, isEmpty);
    return filteredSpec;
}
