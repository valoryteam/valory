import request = require("request");

const api = require("./benchApi");
import {CoreOptions} from "request";
import {convertTime} from "../lib/helpers";

interface TimingData {
	average: number;
	min: number;
	max: number;
	i: number;
}

function benchApi<T extends CoreOptions>(route: string, req: T, margin: number): Promise<TimingData> {
	const uri = `http://localhost:8080${route}`;
	return new Promise((resolve) => {
		const stats: TimingData = {
			average: 0,
			min: Number.MAX_VALUE,
			max: 0,
			i: 0,
		};
		let start: [number, number] = null;
		let end: [number, number] = null;
		let i = 0;
		const bench = (err: Error, data: object) => {
			if (start != null) {
				end = process.hrtime(start);
				const time = convertTime(end);
				const newAverage = stats.average + ((time - stats.average) / (i + 1));
				if (time > stats.max) {
					stats.max = time;
				}
				if (time < stats.min) {
					stats.min = time;
				}
				if (Math.abs(newAverage - stats.average) <= margin) {
					stats.i = i;
					stats.average = newAverage;
					resolve(stats);
					return;
				}
				stats.average = newAverage;
				i++;
			}
			start = process.hrtime();
			request(uri, req, bench);
		};
		bench(null, null);
	});
}

async function runBench() {
	// await benchApi("/warmup", {method: "GET", headers: {Authorization: "stuff"}}, 100);

	const getResults = await benchApi("/burn", {method: "GET", headers: {Authorization: "stuff"}}, 0.000000001);
	console.log("Average latency:", getResults.average.toFixed(3) + "ms");
	console.log("Max latency:", getResults.max.toFixed(3) + "ms");
	console.log("Min latency:", getResults.min.toFixed(3) + "ms");
	console.log("Iterations:", getResults.i);
	api.server.close();
}
runBench();
