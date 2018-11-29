[![npm](https://img.shields.io/npm/v/valory.svg)]()
![build](https://teamcity.modoapi.com/app/rest/builds/buildType:(id:Valory2_Build)/statusIcon)
# Valory
*A server agnostic web framework for creating bulletproof apis*


[![NPM](https://nodei.co/npm/valory.png)](https://nodei.co/npm/valory/)
## Contents
* [Documentation](documentation/index.md)
* [API Reference](http://valory-docs.s3-website-us-east-1.amazonaws.com)
* [Description](#description)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Extensions](#extensions)
* [Contributions](#contributions)
* [Acknowledgements](#acknowledgements)

## Description
Valory is small framework designed to standardize the process of writing well documented, bulletproof api's using whatever server backend you want.

**What it do**
* First class Typescript support with decorator based API
* Uses swagger to specify endpoints
* Supports the entire swagger 2.0 spec (even discriminators)
* Automatically generates swagger documentation
* Performs super fast input validations for requests
* Modular adaptor system that allows you to (with a little work) use any node server

**What it don't do**
* Make you write your code and docs separately

## Installation
First, go and get yourself a jre/jdk (at least version 7) and make sure the path is correctly configured.

Next, you'll need to add the Valory runtime to your project along with a server adaptor
```bash
npm install valory-runtime valory-adaptor-fastify
```
Next, install the cli
```bash
npm i -g valory

# You can install it locally as well for build consistency
npm i -D valory
```

Lastly, you'll need to create a Valory project
```bash
# Run in your project dir and commit the valory.json file
valory init
```
## Basic Usage
Using Valory is pretty straightforward.

**index.ts**
```typescript
import {Valory, Swagger} from "valory-runtime";
import {FastifyAdaptor} from "valory-adaptor-fastify"

// import our controller
import "./someController"

// Define basic info for the api
const info: Swagger.Info = {
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

// Build and start the app, passing any adaptor specific config data
valoryInstance.start({port: 8080});
```

**someController.ts**
```typescript
import {Get, Route, Controller, Post, Body, Path, Header} from "valory-runtime";

export interface Item {
    someField: string;
    optionalField?: string;
    aNumber: number;
}

// Use fancy decorators to generate endpoints
@Route("base") export class SimpleController extends Controller {
    /**
     * Swagger endpoint description
     * @summary swagger summary
     */
    @Get("somepath") public someHandler() {
        return "Some response"
    }
    
    // Function arguments can be injected from request object   
    @Get("{name}") public async someOtherHandler(@Path() name: string, @Header() authorization: string): Promise<string> {
        return `name is ${name}`;
    }
    
    // even complex types work
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

Once you have your api written, you have to compile it.
```bash
# Just run in your project dir next to your valory.json
valory compile
```

Now all you need to do is run it
```bash
# This will be adaptor specific
node path/to/api.js

# Valory provides an adaptor agnostic test command
valory test
```

By default, this will also host a [ReDoc](https://www.npmjs.com/package/redoc) powered documentation site at the site root.

## Extensions
These are the officially maintained adaptors and middleware available for Valory.

**Adaptors**
* [valory-adaptor-slimjim](https://www.npmjs.com/package/valory-adaptor-slimjim)
    * Adaptor that uses slimjim (High speed)
* [valory-adaptor-polka](https://www.npmjs.com/package/valory-adaptor-polka)
    * Adaptor that uses polka (Smallest size)
* [valory-adaptor-fastify](https://www.npmjs.com/package/valory-adaptor-fastify)
    * Adaptor that uses fastify (High stability)
* [valory-adaptor-claudia](https://www.npmjs.com/package/valory-adaptor-claudia)
    * Adaptor for use with [Claudia](https://www.npmjs.com/package/claudia) and [claudia-api-builder](https://www.npmjs.com/package/claudia-api-builder). Allows valory to be deployed as a serverless application in AWS Lambda.

**Middleware**
* [valory-middleware-jwt](https://www.npmjs.com/package/valory-middleware-jwt)
    * Simple JWT auth middleware
    

**Related Projects**
* [parcel-plugin-valory](https://www.npmjs.com/package/parcel-plugin-valory)
    * Plugin for parcel-bundler that adds valory support
    
## Contributions
PR's are welcome!

**PR guidelines**
* Use [Angular Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
* Explain why the change is necessary/helpful

**Roadmap**
- [ ] More comprehensive tests
- [ ] Additional adaptors

## Acknowledgements
- Shoutout to [TSOA](https://github.com/lukeautry/tsoa). Decorator support in Valory is based on that project, huge :thumbsup: