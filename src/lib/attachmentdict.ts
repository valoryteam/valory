export type AttachmentKey<T> = string;

export class AttachmentDict {
	private attachments: {[key: string]: any} = {};

	public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
		if (this.attachments[key] == null) {
			throw Error("Refusing to clobber existing attachment");
		}

		this.attachments[key] = value;
	}

	public getAttachment<T>(key: AttachmentKey<T>): T | null {
		return this.attachments[key] as (T | null);
	}
}