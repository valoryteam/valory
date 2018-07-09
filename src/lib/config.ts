export const CLI_MODE_FLAG = "VALORY_CLI";

export interface ValoryConfig {
	entrypoint: string;
	prettyLog?: boolean;
	outputFile?: string;
	basePath?: string;
	singleError?: boolean;
}

export class Config {
	private static _instance: Config;

	public static get instance(): Config {
		if (Config._instance == null) {
			Config._instance = new Config();
		}
		return Config._instance;
	}

	private constructor() {}



}
