import {Logger} from "pino";

export class Controller {
	public logger: Logger;
	private statusCode: number = 200;
	private headers = {} as { [name: string]: string | undefined };

	public setStatus(statusCode: number) {
		this.statusCode = statusCode;
	}

	public getStatus() {
		return this.statusCode;
	}

	public setHeader(name: string, value?: string) {
		this.headers[name] = value;
	}

	public getHeader(name: string) {
		return this.headers[name];
	}

	public getHeaders() {
		return this.headers;
	}

	public clearStatus() {
		this.statusCode = 200;
	}

	public clearHeaders() {
		this.headers = {};
	}
}
