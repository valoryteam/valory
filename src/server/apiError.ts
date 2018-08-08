interface ApiError extends Error {
	valoryErrorCode: string;
	name: "ValoryEndpointError";
}

const ApiErrorBuilder = (errorCode: string, message?: string) => {
	return {
		valoryErrorCode: errorCode,
		message,
		name: "ValoryEndpointError",
	};
};

export const ApiError = ApiErrorBuilder;
