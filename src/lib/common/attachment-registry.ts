export interface AttachmentKey<T> {
    readonly id: symbol;
    readonly marker: T;
}

export class AttachmentRegistry {
    private attachments: any = {};

    public static createKey<T>(): AttachmentKey<T> {
        return {
            id: Symbol(),
            marker: 0 as any,
        };
    }

    public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
        this.attachments[key.id] = value;
    }

    public getAttachment<T>(key: AttachmentKey<T>): T | null {
        return this.attachments[key.id] as (T | null);
    }
}
