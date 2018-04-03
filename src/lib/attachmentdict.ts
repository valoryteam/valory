// const uuid = require("hyperid")();
//
// export interface AttachmentKey<T> {
// 	id: string;
// 	readonly marker: T;
// }
//
// export class AttachmentDict {
// 	public static createKey<T>(): AttachmentKey<T> {
// 		return {
// 			id: uuid(),
// 			marker: 0 as any,
// 		};
// 	}
// 	private attachments: {[key: string]: any} = {};
//
// 	public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
// 		if (this.attachments[key.id] != null) {
// 			throw Error("Refusing to clobber existing attachment");
// 		}
// 		this.attachments[key.id] = value;
// 	}
//
// 	public getAttachment<T>(key: AttachmentKey<T>): T | null {
// 		return this.attachments[key.id] as (T | null);
// 	}
// }
