# Middleware
Requests in Valory are handled by a chain of middlewares. Almost all functionality is implemented in middlewares; even
routes and internal components like the request validator. Middlewares are essentially just named handlers contained in
objects, so anything that satisfies the interface will work.

**Object literal form**

```typescript
const middleware: ApiMiddleware = {
	name: "NameForTheMiddleware",
	handler(ctx: ApiContext) {
		const authHeader = ctx.request.headers.authorization;
		ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey).info(`The auth header says: ${authHeader}`);
	}
} 
```
**Class form**

```typescript
class middleware implements ApiMiddleware {
	public name = "NameForTheMiddleware";
	public handler(ctx: ApiContext) {
		const authHeader = ctx.request.headers.authorization;
		ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey).info(`The auth header says: ${authHeader}`);
	}
}
```

### Handler
The middleware handler itself is fairly straightforward
```typescript
const handler: ApiMiddlewareHandler = (ctx: ApiContext) => {
	// The api context contains the full request, attachments, and in progress response
	const authHeader = ctx.request.headers.authHeader;
	
	// There will always be an appropriate logger attached
    const logger = ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey);
	logger.info(`The auth header says: ${authHeader}`);
	
	if (authHeader == null) {
        // You can modify the response on the context. Keep in mind that this will not keep any other middleware from 
        // running, and something else further down the chain could modify change here. You can prevent this by adding
        // an attachment that gets checked, or throwing an exception that gets mapped later on.
		ctx.response = {
			statusCode: 200,
			header: {
				thing: "value",
			},
			body: {
				property: "value",
			}
		}
	}
}
```

### Registering middleware
Every request handler has a middleware chain which functions as a simple queue. Because of this, middleware is always
added by either prepending or appending to this list. Additionally, this can be done globally for every endpoint at once
in Valory.createInstance. The route handler (Primary Handler) will be run after all middleware explicitly appended, but
before all middleware explicitly appended.

```typescript
const app = Valory.createInstance({
   adaptor: new DefaultAdaptor(8080),
   openapi: {
       info: {
           title: "Test Api",
           version: "1"
       }
   },
    // Add this set of middleware to the front of every endpoint
    beforeAllMiddleware: [somekindamiddleware],
    // Add this set of middleware to the end of every endpoint
    afterAllMiddleware: [somekindamiddleware],
});

@PrependMiddleware(somekindamiddleware) // Middleware can be prepended to every endpoint in a controller...
@Route("/") export class SimpleController extends Controller {
    @PrependMiddleware(somekindamiddleware) // ...or to a specific endpoint
    @Get("somepath") public someHandler() {
        return "Some response"
    }
    
    @AppendMiddleware(somekindamiddleware) // Middleware can also be appended in the same way
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
