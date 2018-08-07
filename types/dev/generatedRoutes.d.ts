import { Valory } from "../main";
declare const _default: {
    register: (app: Valory) => void;
    definitions: {
        ArrayAlias: {
            type: string;
            items: {
                type: string;
                format: string;
            };
        };
        StringAlias: {
            type: string;
            description: string;
            example: string;
            minLength: number;
        };
        AliasAlias: {
            $ref: string;
        };
        LiteralAlias: {
            type: string;
            enum: string[];
        };
        LiteralNum: {
            type: string;
            enum: number[];
        };
        Burn: {
            properties: {
                name: {
                    type: string;
                    default: string;
                    minLength: number;
                };
                content: {
                    type: string;
                };
                powerlevel: {
                    type: string;
                    format: string;
                };
                array: {
                    $ref: string;
                };
                string: {
                    $ref: string;
                };
                alias: {
                    $ref: string;
                };
                literalEnum: {
                    type: string;
                    enum: string[];
                };
                literal: {
                    $ref: string;
                };
                literalNum: {
                    $ref: string;
                };
            };
            required: string[];
            type: string;
        };
        TestResponseBurnArray: {
            properties: {
                status_code: {
                    type: string;
                    format: string;
                };
                response_data: {
                    type: string;
                    items: {
                        $ref: string;
                    };
                };
            };
            required: string[];
            type: string;
        };
        TestObjstring: {
            properties: {
                thing: {
                    type: string;
                };
                generic: {
                    type: string;
                };
                otherThing: {
                    type: string;
                    format: string;
                };
                nested: {
                    type: string;
                    description: string;
                    properties: {
                        nestedProp: {
                            type: string;
                            description: string;
                        };
                        nestedObj: {
                            type: string;
                            properties: {
                                num: {
                                    type: string;
                                    format: string;
                                };
                            };
                            required: string[];
                        };
                    };
                    required: string[];
                };
            };
            required: string[];
            type: string;
        };
    };
};
export = _default;
