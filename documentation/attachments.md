# Attachments
Attachments are a way to attach additional data to a request. This is how data should be passed between middlewares.
```typescript
class middleware implements ApiMiddleware {
	/**
	 * First, you'll need an attachment key. This both identifies your data and holds 
	 * type information. It works best as static property, that way you can access from
	 * the request handler without needing the middleware instance.
	 **/
	public static DataKey: AttachmentKey<string> = AttachmentRegistry.createKey<string>();

	public name = "NameForTheMiddleware";

	public handler(ctx: ApiContext) {
		const authHeader = ctx.request.headers.authorization;

		// You can then use that key to attach data to the request
		ctx.attachments.putAttachment(middleware.DataKey, authHeader);
	}
}

/**
 * You can then access that data anywhere down the chain including the request handler
 * and subsequent middleware.
 **/

@Route("/") export class SimpleController extends Controller {
    // you can use the Request decorator to get the full request object
    @Middleware(new middleware())
    @Get("somepath") public someHandler() {
        // Use the key you created earlier to retrieve the data.
        const attachmentData = this.ctx.attachments.getAttachment(middleware.DataKey);
        
        // You can also use the existence of a key (or set of keys) as a flag
        if (!this.ctx.attachments.hasAttachment(middleware.DataKey)) {
            throw new Error("Oh no!");
        }

        return attachmentData;
    }
}
```

## Builtin Attachments
* Endpoint.ExceptionKey
    * If present, contains the last exception to occur in the execution chain. Request handler will not be
     executed if present. Middleware handlers will still be run.
* Endpoint.HandlerLoggerKey
    * Contains a pino child logger with appropriate bindings for the current handler.
* RequestValidator.ValidationErrorsKey
    * If present, contains a set of errors that occurred while processing the request. Request handler will not be
    executed if present. Middleware handlers will still be run.

**Important Notes**
* Because of the key, this entire process is type safe
* getAttachment will not complain if a key does not exist, it will simply return null
