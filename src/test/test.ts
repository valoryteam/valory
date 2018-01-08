import {expect} from "chai";
import * as path from "path";
import requestPromise = require("request-promise");
import {Options, RequestPromiseOptions} from "request-promise";
import {execSync} from "child_process";
import {suite, test, slow, timeout} from "mocha-typescript";

const valoryPath = path.join(__dirname, "../server/valory.js");
const testApiPath = path.join(__dirname, "testApi.js");

let api: any = null;

@suite class ValoryTest {
	public static after() {
		api.server.close();
	}

	@timeout(200000)
	public static before() {
		execSync(`${process.execPath} ${valoryPath} ${testApiPath} -v 1`);
		api = require("./testApi");
	}

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
		const resObj = response;
		try {
			expect(resObj).to.not.have.property("code");
		} catch (err) {
			throw new Error("Failed response validation: " + JSON.stringify(resObj));
		}
	}
}
