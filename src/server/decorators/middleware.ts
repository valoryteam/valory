import {ApiMiddleware} from "../valory";

export function Middleware(middleware: ApiMiddleware): any {
	return (target: any, propertyKey?: string) => {
		if (propertyKey != null) {
			target = target[propertyKey];
		} else {
			target = target.prototype;
		}
		if (target.middleware == null) {
			target.middleware = [];
		}
		target.middleware.push(middleware);
	};
}

export function PostMiddleware(middleware: ApiMiddleware): any {
	return (target: any, propertyKey?: string) => {
		if (propertyKey != null) {
			target = target[propertyKey];
		} else {
			target = target.prototype;
		}
		if (target.postMiddleware == null) {
			target.postMiddleware = [];
		}
		target.postMiddleware.push(middleware);
	};
}
