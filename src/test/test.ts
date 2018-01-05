import {expect} from "chai";
import {execFileSync, execSync} from "child_process";
import * as path from "path";
import {suite, test, slow, timeout} from "mocha-typescript";

const valoryPath = path.join(__dirname, "../server/valory.js");
const testApiPath = path.join(__dirname, "testApi.js");

@suite class ValoryTest {
	@test(timeout(200000), slow(20000))
	public RunCompiler() {
		execSync(`node ${valoryPath} ${testApiPath} -v 1`);
	}

	@test
	public StartTestServer() {
		console.log(JSON.stringify(require("./testApi")));
	}
}
