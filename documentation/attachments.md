# Attachments
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
* getAttachment will not complain if a key does not exist, it will simply return null