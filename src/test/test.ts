import {expect} from "chai";
import * as path from "path";
import * as fs from "fs";
import {Options} from "request-promise";
import {execSync, exec, ChildProcess} from "child_process";
import {suite, test, timeout} from "mocha-typescript";
import requestPromise = require("request-promise");
import {ValoryConfig} from "../lib/config";

const valoryPath = path.join(__dirname, "../lib/cli.js");
const valoryConfig = path.join(__dirname, "../../valory.json");

const configOverride: ValoryConfig = {
	entrypoint: "dist/test/testApi.js",
	sourceEntrypoint: "src/test/testApi.ts",
	singleError: false,
};

// let api: any = null;

@suite
class ValoryTest {
	public static after() {
		if (fs.existsSync(valoryConfig)) {
			fs.writeFileSync(valoryConfig, ValoryTest.currentConfig);
		}
		process.kill(ValoryTest.serverProc.pid + 1, "SIGTERM");
	}

	@timeout(200000)
	public static before() {
		if (fs.existsSync(valoryConfig)) {
			ValoryTest.currentConfig = fs.readFileSync(valoryConfig);
		}
		fs.writeFileSync(valoryConfig, JSON.stringify(configOverride));

		process.env.NODE_ENV = "test";
		const cmdOut = execSync(`${process.execPath} ${valoryPath} compile`, {
			cwd: path.join(__dirname, "../.."),
		});
		return new Promise((resolve, reject) => {
			ValoryTest.serverProc = exec(`${process.execPath} ${valoryPath} test`, {
				cwd: path.join(__dirname, "../.."),

			});
			// ValoryTest.serverProc.stdout.pipe(process.stdout);
			// ValoryTest.serverProc.stderr.pipe(process.stdout);
			setTimeout(resolve, 500);
		});
	}

	private static currentConfig: Buffer = null;
	private static serverProc: ChildProcess;

	@test
	public async TestSimpleGET() {
		const getRequest: Options = {
			method: "GET",
			uri: "http://localhost:8080/burn",
			headers: {
				Authorization: "Token aoisretn",
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = JSON.parse(response);
		// console.log(resObj);
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + response);
		}
	}

	@test
	public async TestSimplePOST() {
		const getRequest: Options = {
			method: "POST",
			uri: "http://localhost:8080/burn",
			headers: {
				Authorization: "application/json",
			},
			json: {
				sickBurn: "yay",
				burnType: {
					type: "sick",
					pet: {
						dtype: "Cat",
						name: "Joey",
						huntingSkill: "lazy",
					},
				},
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = response;
		// console.log(resObj);
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + JSON.stringify(resObj));
		}
	}

	@test
	public async TestRestfulGET() {
		const getRequest: Options = {
			method: "GET",
			uri: "http://localhost:8080/burn/test",
			headers: {
				Authorization: "Token aoisretn",
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = JSON.parse(response);
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + response);
		}
	}

	@test
	public async TestFormPOST() {
		const getRequest: Options = {
			method: "POST",
			uri: "http://localhost:8080/formtest",
			headers: {
				"Authorization": "Token aoisretn",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			form: {
				potato: "true",
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = JSON.parse(response);
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + JSON.stringify(resObj));
		}
	}

	@test
	public async TestMiddleware() {
		const getRequest: Options = {
			method: "POST",
			uri: "http://localhost:8080/formtest",
			headers: {
				"Authorization": "Token aoisretn",
				"Content-Type": "application/x-www-form-urlencoded",
				"testheader": "teststring",
			},
			form: {
				potato: "true",
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = JSON.parse(response);
		expect(resObj).to.have.property("TestMiddleware").to.have.property("test").eq("teststring");
	}

	@test
	public async TestGeneratedGET() {
		const getRequest: Options = {
			method: "GET",
			uri: "http://localhost:8080/test",
			headers: {
				Authorization: "Token aoisretn",
			},
		};

		const response = await requestPromise(getRequest);
		const resObj = JSON.parse(response);
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + response);
		}
	}

	@test
	public async TestGeneratedPOST() {
		const getRequest: Options = {
			method: "POST",
			uri: "http://localhost:8080/test/submit",
			headers: {
				Authorization: "application/json",
			},
			json: {
				name: "john",
				isCool: true,
			},
		};

		const response = await requestPromise(getRequest);
		try {
			expect(response).to.equal("john is cool");
		} catch (err) {
			throw new Error("Failed response validation: " + response);
		}
	}
}
