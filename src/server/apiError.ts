/**
 * All of This is very confusing and will need some serious rework. Getting hidden for now.
 */

/** @hidden */
interface ApiError extends Error {
	valoryErrorCode: string;
	name: "ValoryEndpointError";
}

/** @hidden */
const ApiErrorBuilder = (errorCode: string, message?: string) => {
	return {
		valoryErrorCode: errorCode,
		message,
		name: "ValoryEndpointError",
	};
};

/** @hidden */
export const ApiError = ApiErrorBuilder;
