import {Controller} from "../controller";

export function Route(name?: string): any {
	// console.log("route tag factory");
	return (target: Controller) => {
		// console.log("route tag evaluated");
		// console.log(target);
		// (target as any).prototype.middleware = [];
		// (target as any).prototype.postMiddleware = [];
		return;
	};
}

/**
 * can be used to entirely hide an method from documentation
 */
export function Hidden(): any {
	return () => {
		return;
	};
}
