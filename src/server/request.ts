import {ApiExchange} from "./valory";
export type AttachmentKey<T> = string;

export interface ApiRequestOptions {
    headers: { [key: string]: any; };
    body: any;
    rawBody: any;
    formData: { [key: string]: any; };
    query: { [key: string]: any; };
    path: { [key: string]: any; };
    route: string;
}

export class ApiRequest implements ApiExchange {
    public headers: { [key: string]: any; };
    public body: any;
    public rawBody: any;
    public formData: { [key: string]: any; };
    public query: { [key: string]: any; };
    public path: { [key: string]: any; };
    public route: string;
    public attachments: {[key: string]: any} = {};

    constructor(options: ApiRequestOptions) {
        this.headers = options.headers;
        this.body = options.body;
        this.rawBody = options.rawBody;
        this.formData = options.formData;
        this.query = options.query;
        this.route = options.route;
        this.path = options.path;
    }

	public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
		if (this.attachments[key] == null) {
			throw Error("Refusing to clobber existing attachment");
		}
		this.attachments[key] = value;
	}

	public getAttachment<T>(key: AttachmentKey<T>): T | null {
		return this.attachments[key] as (T | null);
	}
}