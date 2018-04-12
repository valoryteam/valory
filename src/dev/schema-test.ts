import {Spec} from "swagger-schema-official";
import {compile} from "../compiler/compiler";

const swagger = require("../../testswagger.json") as Spec;

async function runTest() {
	const out = await compile(swagger, {debug: false});
	console.log(out.module);
}

runTest();
