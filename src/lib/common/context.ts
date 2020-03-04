import {ApiResponse} from "./response";
import {ApiRequest} from "./request";
import {AttachmentRegistry} from "./attachment-registry";
import uuid = require("uuid-random");

export class ApiContext {
    public response: ApiResponse = {
        body: {},
        headers: {},
        statusCode: 200
    };
    public readonly attachments = new AttachmentRegistry();
    public readonly requestId = uuid();

    constructor(public readonly request: ApiRequest) {}

    public responseContentType() {
        return this.response.headers["content-type"] || "application/json"
    }

    public serializeResponse() {
        const contentType = this.responseContentType();
        if (this.response.body == null) {return ""}
        switch (contentType) {
            case "application/json":
                return JSON.stringify(this.response.body);
            default:
                return this.response.body;
        }
    }
}
