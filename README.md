#Valory
*A fast, swagger based, server agnostic web framework*

##Contents
* [Description](#description)
* [Installation](#installation)
* [Usage](#basic-usage)
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

##Basic Usage
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
const api = Valory.getInstance();


// Register an enpoint with the full expressive power of swagger 2.0
api.get("/somepath", {
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
	return api.buildSuccess("Thing");
});

// Build and export the app, passing any adaptor specific config data
export = api.start({port: 8080});
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


##Adaptors
* [valory-adaptor-fastify](https://www.npmjs.com/package/valory-adaptor-fastify)
    * Adaptor for use with fastify framework, good option for use as a standalone api server
* [valory-adaptor-claudia](https://www.npmjs.com/package/valory-adaptor-claudia)
    * Adaptor for use with [Claudia](https://www.npmjs.com/package/claudia) and [claudia-api-builder](https://www.npmjs.com/package/claudia-api-builder). Allows valory to be deployed as a serverless application in AWS Lambda.

##Middleware
* [valory-middleware-jwt](https://www.npmjs.com/package/valory-middleware-jwt)
    * Simple JWT auth middleware