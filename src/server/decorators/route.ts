import {Controller} from "../controller";

export function Route(name?: string): any {
	return (target: Controller) => {
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
