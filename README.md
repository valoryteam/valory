#Valory
*A fast, swagger based, server agnostic web framework*

##Contents
* [Description](#description)
* [Installation](#installation)
* [Usage](#usage)
* [Release History](#release-history)
* [API documentation](http://valory-docs.s3-website-us-east-1.amazonaws.com)
* [Adaptors](#adaptors)
* [Middleware](#middleware)

##Description
Valory is small framework designed to standardize the process of writing well documented, bulletproof api's using whatever server backend you want. 

**What it do**
* Uses swagger to specify endpoints
* Supports the entire swagger 2.0 spec (even discriminators)
* Automatically generates swagger documentation
* Performs super fast input validations for requests
* Modular adaptor system that allows you to (with a little work) use any node server

**What it don't do**
* Make you write your code and docs separately

##Installation
First, go and get yourself a jre/jdk (at least version 7) and make sure the path is correctly configured.

Next, you'll need to add Valory to your project
```bash
npm install valory
```
For easy access to the cli, you should add it globally as well
```bash
npm install -g valory
```

##Usage
Using Valory is pretty straightforward.
```javascript
const Sentencer = require("sentencer");
const Valory = require('valory').Valory;

// We also need a server core adaptor
const FastifyAdaptor = require("valory-adaptor-fastify").FastifyAdaptor;

//Create a valory instance
const Appserver = new Valory({title: 'burnApi'}, [], undefined, undefined, {
        BurnName: {
                type: "object",
                required: [
                        "name"
                ],
                properties: {
                        name: {
                                type: "string"
                        }
                }
        }
}, new FastifyAdaptor());

//Add a basic endpoint
Appserver.endpoint("/burn", "get", {
        description: "Awful, horrible burns",
        summary: "/burn",
        responses: {
                200: {
                        description: "Returns a burn"
                }
        }
},function(){return Sentencer.make("You are {{ an_adjective }} {{ noun }}");}, true);

//Add an endpoint with parameters
Appserver.endpoint("/burnPerson", "post", {
        description: "Burn a name",
        summary: "/burnPerson",
        parameters: [
                {
                        required: true,
                        name: "body",
                        schema: {
                                $ref: "#/definitions/BurnName" //You can even ref definitions you created in with valory
                        },
                        in: "body"
                }
        ],
        responses: {
                200: {
                        description: "Returns a thing"
                }
        }
}, function(request){return Sentencer.make(request.body.name + " is {{ an_adjective }} {{ noun }}");}, true);

//At the very end, call the start method with any required options for your server and export the result
module.exports = Appserver.start({port: 8080});
```
And that's all you need for a fully functional api.  All you have to do now is run
```bash
valory "API ENTRYPOINT" "API DOMAIN NAME" -v "version string"
```
That command will generate a swagger.json file and compile the swagger down to validator functions. Then all you have
left to do is run it directly

```bash
node "API ENTRYPOINT"
```

By default, this will also host a [ReDoc](https://www.npmjs.com/package/redoc) powered documentation site at the site root.


##Adaptors
* [valory-adaptor-fastify](https://www.npmjs.com/package/valory-adaptor-fastify)
    * Adaptor for use with fastify framework, good option for use as a standalone api server
* [valory-adaptor-claudia](https://www.npmjs.com/package/valory-adaptor-claudia)
    * Adaptor for use with [Claudia](https://www.npmjs.com/package/claudia) and [claudia-api-builder](https://www.npmjs.com/package/claudia-api-builder). Allows valory to be deployed as a serverless application in AWS Lambda.

##Middleware
* [valory-middleware-jwt](https://www.npmjs.com/package/valory-middleware-jwt)
    * Simple JWT auth middleware