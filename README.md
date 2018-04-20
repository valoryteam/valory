# Valory
*A fast, swagger based, server agnostic web framework*

## Contents
* [API documentation](http://valory-docs.s3-website-us-east-1.amazonaws.com)
* [Description](#description)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Middleware](#middleware)
* [Attachments](#attachments)
* [Errors](#errors)
* [Extensions](#extensions)

## Description
Valory is small framework designed to standardize the process of writing well documented, bulletproof api's using whatever server backend you want.

**What it do**
* Uses swagger to specify endpoints
* Supports the entire swagger 2.0 spec (even discriminators)
* Automatically generates swagger documentation
* Performs super fast input validations for requests
* Modular adaptor system that allows you to (with a little work) use any node server

**What it don't do**
* Make you write your code and docs separately

## Installation
First, go and get yourself a jre/jdk (at least version 7) and make sure the path is correctly configured.

Next, you'll need to add Valory to your project along with a server adaptor
```bash
npm install valory valory-adaptor-fastify
```
For easy access to the cli, you should add it globally as well
```bash
npm install -g valory
```

## Basic Usage
Using Valory is pretty straightforward.
```typescript
import {Valory} from "valory";
import {Info} from "swagger-schema-official"
import {FastifyAdaptor} from "valory-adaptor-fastify"

// Define basic info for the api
const info: Info = {
	title: "Test api",
	version: "1",
};

// Create the valory singleton
Valory.createInstance({
    info,
    server: new FastifyAdaptor(),
});

// Retrieve the valory instance (can be called anywhere)
const valoryInstance = Valory.getInstance();


// Register an enpoint with the full expressive power of swagger 2.0
valoryInstance.get("/somepath", {
	description: "Does a thing",
	summary: "Do a thing",
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
	parameters: [],
}, (req) => {
	// The handler can be sync or async
	
	// Build a successful response with the helper
	return valoryInstance.buildSuccess("Thing");
});

// Build and export the app, passing any adaptor specific config data
export = valoryInstance.start({port: 8080});
```

Once you have your api written, you have to compile it.
```bash
# This obviously requires you to install valory globaly

# Make sure to point to the compiled js file if using typescript
valory compile path/to/api.js
```

Now all you need to do is run it
```bash
# This will be adaptor specific
node path/to/api.js

# Valory provides a adaptor agnostic test command
valory test path/to/api.js
```

By default, this will also host a [ReDoc](https://www.npmjs.com/package/redoc) powered documentation site at the site root.

## Middleware
Middlewares in valory are essentially just reusable objects (literals or class instances) that provide a name and a handler. There are two main ways of doing this

**Object literal form**
```typescript
const middleware: ApiMiddleware = {
	name: "NameForTheMiddleware",
	handler: (request: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) => {
		const authHeader = request.headers.authorization;
		logger.info(`The auth header says: ${authHeader}`);
		done();
	}
} 
```
**Class form**
```typescript
class middleware implements ApiMiddleware {
	public name = "NameForTheMiddleware";
	public handler(request: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) {
		// The format of the handler is the same
		const authHeader = request.headers.authorization;
		logger.info(`The auth header says: ${authHeader}`);
		done();
	}
}
```

### Handler
The middleware handler itself is fairly straightforward
```typescript
const handler: ApiMiddlewareHandler = (request: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) => {
	// The request parameter is the full incoming request
	const authHeader = request.headers.authHeader;
	
	// The logger parameter is a pino child logger with middleware and request specific metadata already attached
	logger.info(`The auth header says: ${authHeader}`);
	
	if (authHeader != null) {
		// Call done with no arguments to continue the request
		done();
	} else {
		// Pass done an [[ApiResponse]] object to end the request
		done({
			statusCode: 200,
			header: {
				thing: "value",
			}
			body: {
				property: "value",
			}
		})
	}
}
```

### Registering middleware
There are two main types of middleware; global and local. Global middleware is run with every endpoint, while local is registered on a per endpoint basis.  Additionally, there is post for of both global and local that is run after the request handler.

```typescript
// Add a global middleware run before every request
valoryInstance.addGlobalMiddleware(somekindamiddleware);

// Add a global post middleware run after every request
valoryInstance.addGlobalPostMiddleware(somekindamiddleware);

// To add local middleware, pass them as arrays in the endpoint specification 
valoryInstance.get("/somepath", {
	description: "Does a thing",
	summary: "Do a thing",
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
	parameters: [],
}, (req) => {
	return valoryInstance.buildSuccess("Thing");
}, [array, of, middleware], true, [array, of, post, middleware]);
```

**Execution order**
1. Global Middleware
2. Local Middleware
3. Request Handler
4. Global Post Middleware
5. Local Post Middleware

## Attachments
Attachments are a way to attach additional data to a request. This is especially useful when you want data generated in a middleware to be available to the request handler.
```typescript
class middleware implements ApiMiddleware {
	/**
	 * First, you'll need an attachment key. This both identifies your data and holds 
	 * type information. It works best as static property, that way you can access from
	 * the request handler without needing the middleware instance.
	 **/
	public static DataKey: AttachmentKey<string> = ApiRequest.createKey<string>();

	public name = "NameForTheMiddleware";

	public handler(request: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) {
		const authHeader = request.headers.authorization;

		// You can then use that key to attach data to the request
		req.putAttachment(middleware.DataKey, authHeader);

		done();
	}
}

/**
 * You can then access that data anywhere down the chain including the request handler
 * and subsequent middleware.
 **/
valoryInstance.get("/somepath", {
	description: "Does a thing",
	summary: "Do a thing",
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
	parameters: [],
}, (req) => {
	// Use the key you created earlier to retrieve the data.
	const attachmentData = req.getAttachment(middleware.DataKey);

	return valoryInstance.buildSuccess(attachmentData);
}, [new middleware()]);
``` 
**Important Notes**
* Because of the key, this entire process is type safe
* putAttachment will not clobber existing attachments. Duplicate keys will result in an exception
* getAttachment will return not complain if a key does not exist, it will simply return null

## Errors
Valory provides a simple way to manage reusable error messages. Just pass a map of [[ErrorDef]] objects when creating the valory instance.

**Creating Errors**
```typescript
const errors: {[name: string]: ErrorDef} = {
    // The key is used as the error name
    SomeError: {
        statusCode: 200, // http status code
        errorCode: 1337, // error code returned in the response body
        defaultMessage: "Something bad happened", // default message in the response body
    }
};

// Errors must be registered when you initially create the valory instance
Valory.createInstance({
    info,
    server: new FastifyAdaptor(),

    errors: [error], // You can include as many errors as you want
});
```
**Using Errors**
```typescript
valoryInstance.get("/somepath", {
	description: "Does a thing",
	summary: "Do a thing",
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
	parameters: [],
}, (req) => {
	// Use the key you created earlier to retrieve the data.
	const attachmentData = req.getAttachment(middleware.DataKey);

    // Use the buildError method on the valory instance to convert any error into an [[ApiResponse]]
	return valoryInstance.buildError("SomeError", "default message override");
});
```

### Overriding the default error format
By default, errors are output in the format:
```
body: {
   code: "The errorCode",
   message: "The error message",
}
```
If this behaviour is not to your liking, you can override it by specifying an alternate [[ErrorFormatter]].
```typescript
// Just accept an ErrorDef and a message string, and then return an ApiRequest
const errorFormatter: ErrorFormatter = (error, message): ApiResponse => {
    return {
        statusCode: error.statusCode,
        body: {
            status_code: error.errorCode,
            message: (message != null) ? message : error.defaultMessage,
        },
        headers: {"Content-Type": "application/json"},
    };
}

// Then set the error formatter
valoryInstance.setErrorFormatter(errorFormatter);
```

## Extensions
These are the officially maintained adaptors and middleware available for Valory.

**Adaptors**
* [valory-adaptor-fastify](https://www.npmjs.com/package/valory-adaptor-fastify)
    * Adaptor for use with fastify framework, good option for use as a standalone app server
* [valory-adaptor-claudia](https://www.npmjs.com/package/valory-adaptor-claudia)
    * Adaptor for use with [Claudia](https://www.npmjs.com/package/claudia) and [claudia-api-builder](https://www.npmjs.com/package/claudia-api-builder). Allows valory to be deployed as a serverless application in AWS Lambda.

**Middleware**
* [valory-middleware-jwt](https://www.npmjs.com/package/valory-middleware-jwt)
    * Simple JWT auth middleware