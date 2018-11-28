import {ApiExchange} from "./valoryheaders";

/**
 * A unique key that refers to an attachment and its type.
 */
export interface AttachmentKey<T> {
	readonly id: symbol;
	/** @hidden */ readonly marker: T;
}

export interface ApiRequestOptions {
    headers: { [key: string]: any; };
    body: any;
    rawBody: any;
    formData: { [key: string]: any; };
    query: { [key: string]: any; };
    path: { [key: string]: any; };
    route: string;
}

/**
 * Holds all the data associated with an incoming request
 */
export class ApiRequest implements ApiExchange {
	/**
	 * Create an attachment key
	 * @return {AttachmentKey<T>}
	 */
	public static createKey<T>(): AttachmentKey<T> {
		return {
			id: Symbol(),
			marker: 0 as any,
		};
	}
    public headers: { [key: string]: any; };
    public body: any;
	/**
	 * This is the raw, unparsed body. Due to limitations with some servers, providing this may not always be possible.
	 * Check with your adaptor before using this.
	 */
	public rawBody: any;
    public formData: { [key: string]: any; };
    public query: { [key: string]: any; };
    public path: { [key: string]: any; };
    public route: string;
	private attachments: any = {};
    // public attachments: AttachmentDict;

	constructor(options: ApiRequestOptions) {
        this.headers = options.headers;
        this.body = options.body;
        this.rawBody = options.rawBody;
        this.formData = options.formData;
        this.query = options.query;
        this.route = options.route;
        this.path = options.path;
    }

	/**
	 * Add an attachment to this request.
	 */
	public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
		this.attachments[key.id] = value;
	}

	/**
	 * Retrieve an attachment from this request
	 */
	public getAttachment<T>(key: AttachmentKey<T>): T | null {
		return this.attachments[key.id] as (T | null);
	}
}
