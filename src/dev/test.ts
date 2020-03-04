import {Valory} from "../server/valory"
import {DefaultAdaptor} from "../lib/default-adaptor";

const app = Valory.createInstance({
   adaptor: new DefaultAdaptor(8080),
   openapi: {
       info: {
           title: "Test Api",
           version: "1"
       }
   }
});

app.endpoint("/test", "GET", {})
    .addMiddleware({
        name: "Primary handler",
        handler(ctx) {
            ctx.response.body = {
                thing: 3
            }
        },
    }, 50)
    .done();

export = app.start();
