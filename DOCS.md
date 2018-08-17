## Contents
* [Middleware](#middleware)
* [Attachments](#attachments)
* [Errors](#errors)
* [Controlling Validation](#controlling-validation)
* [API documentation](http://valory-docs.s3-website-us-east-1.amazonaws.com)

## Middleware
Middlewares in valory are essentially just reusable objects (literals or class instances) that provide a name and a handler. All middleware are run regardless of request validation result. There are two main ways of doing this

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
			},
			body: {
				property: "value",
			}
		})
	}
}
```

### Registering middleware
There are two main types of middleware; global and local. Global middleware is run with every endpoint, while local is registered on a per endpoint basis.  Additionally, there is post for of both global and local that is run after the request handler.  Post middleware have access to both the handler response and full validation result through built in attachments.

```typescript
// Add a global middleware run before every request
valoryInstance.addGlobalMiddleware(somekindamiddleware);

// Add a global post middleware run after every request
valoryInstance.addGlobalPostMiddleware(somekindamiddleware);


@Middleware(somekindamiddleware) // Middleware can be added to every endpoint in a controller...
@Route("/") export class SimpleController extends Controller {
    @Middleware(somekindamiddleware) // ...or to a specific endpoint
    @Get("somepath") public someHandler() {
        return "Some response"
    }
    
    @PostMiddleware(somekindamiddleware) // post middleware works the same way    
    @Post("submit") public submit(@Body() input: Item): {content: Item} {
        // set the status code
        this.setStatus(418);
        
        // access request logger
        this.logger.info("yay!");
        
        return {
            content: input,
        }
    }
}
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

@Route("/") export class SimpleController extends Controller {
    // you can use the Request decorator to get the full request object
    @Middleware(new middleware())
    @Get("somepath") public someHandler(@Request() req: ApiRequest) {
        // Use the key you created earlier to retrieve the data.
        const attachmentData = req.getAttachment(middleware.DataKey);
        
        return attachmentData;
    }
}
``` 
**Important Notes**
* Because of the key, this entire process is type safe
* putAttachment will not clobber existing attachments. Duplicate keys will result in an exception
* getAttachment will not complain if a key does not exist, it will simply return null

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
@Route("/") export class SimpleController extends Controller {
    // you can use the Request decorator to get the full request object
    @Middleware(new middleware())
    @Get("somepath") public someHandler(@Request() req: ApiRequest) {
        return this.buildError("SomeError", "default message override");
    }
}
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

## Controlling Validation
All requests to Valory endpoints are validated based off a swagger spec generated from Typescript definitions.
The goal was to make this as seamless and intuitive as possible, requiring minimal changes to style and workflow.
This is a simplified guide to explain some of the common cases and how to handle them.

### Form/JSON input
Form and JSON input is the easiest use case here, and is handled exactly as you would expect
```typescript
// Interfaces are the simplest way of handling most cases
export interface Item {
  field: string;
  // optional properties work as you would expect
  optionalProp?: string;
}

// Inheritance is also supported
export interface CoolItem extends Item {
  cool: boolean;
}

// If you need to include default values, then use a simple class
export class ItemWithDefaults {
    public field = "a default value";
    
    // Private fields are ignored
    private hidden: string;
}
```

### Reusable fields
Say you have a "name" field use multiple places. You could redefine it multiple places, but that would be require effort and violate DRY.
Type aliases to the rescue!
```typescript
/**
 * JSDOC properties are preserved whenever this is used
 */
export type Name = string;

// constant values are also supported
export type ConstantValue = "a value";
```
Additionally, type aliases are the only reference type allowed for Headers, Path, and Query parameters.

### Descriptions, examples, and Swagger validations
When writing api's you frequently need to be very specific about allowed inputs. This additional specifications is handled with JSDOC.
```typescript
// JSDOC properties are used to add swagger metadata
/**
 * JSDOC descriptions work as descriptions
 * @example "example value"
 * @minLength 5
 */
export type Name = string;
// all swagger parameter validation keywords are supported this way

// Also works on properties in complex objects
/**
 * a description
 */
export interface Item {
    /**
     * property description
     * @maxLength 47
     */
    prop: string;
}
```

## Adaptors
One of the central conceits of Valory is that is not a web server, but instead uses adaptors to run on top of any server framework.
The [default adaptor](src/lib/defaultAdaptor.ts) is a decent example that uses fastify.
```typescript
// adaptors implement ApiServer
export class SomeAdaptor implements ApiServer {
    public readonly locallyRunnable = true; // Whether or not the adaptor can be run locally
    public readonly allowDocSite = true; // Whether or not a ReDoc site should be created on startup
    
    public register(path: string, method: HttpMethod, handler: (request: ApiRequest) => ApiResponse | Promise<ApiResponse>) {
        // register an endpoint on the underlying server that runs a given handler
    }
    
    public getExport(metadata: ValoryMetadata, options: any) {
        // Start the server using options if needed
    }
    
    public shutdown() {
        // shutdown the underlying server
    }
}
```