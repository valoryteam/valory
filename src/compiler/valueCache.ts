import {sha1String} from "../lib/helpers";

export class ValueCache {
	private counter = 0;
	private cache: { [key: string]: {identifier: string, value: string, usages: number} } = {};

	public add(value: string): string {
		const key = sha1String(value);
		if (this.cache[key]) {
			this.cache[key].usages++;
			return this.cache[key].identifier;
		} else {
			this.cache[key] = {
				identifier: this.getIdentifier(),
				value,
				usages: 1,
			};
			return this.cache[key].identifier;
		}
	}

	public generate(): string {
		return Object.values(this.cache).map((value) => {
			let ret = `const ${value.identifier} = ${value.value};\n`;
			if (value.usages > 1) {
				ret = "/** @noinline */ " + ret;
			}
			return ret;
		}).join("");
	}

	private getIdentifier() {
		return "v" + ++this.counter;
	}
}
