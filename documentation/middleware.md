# Middleware
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