declare module "json-schema-merge-allof" {
    import {JSONSchema4} from "json-schema";

    function mergeAllOf(schema: JSONSchema4): JSONSchema4

    export = mergeAllOf;
}
