export interface AttachmentKey<T> {
    readonly id: symbol;
    readonly marker: T;
}

export class AttachmentRegistry {
    private attachments = new Map<symbol, any>();

    public static createKey<T>(): AttachmentKey<T> {
        return {
            id: Symbol(),
            marker: 0 as any,
        };
    }

    public putAttachment<T>(key: AttachmentKey<T>, value: T): void {
        this.attachments.set(key.id, value);
    }

    public getAttachment<T>(key: AttachmentKey<T>): T | null {
        return this.attachments.get(key.id);
    }

    public hasAttachment<T>(key: AttachmentKey<T>): boolean {
        return this.attachments.has(key.id);
    }

    public hasAllAttachments(keys: AttachmentKey<any>[]): boolean {
        const size = keys.length;
        for (let i = 0; i < size; i++) {
            if (!this.attachments.has(keys[i].id)) {
                return false
            }
        }
        return true
    }

    public hasAnyAttachments(keys: AttachmentKey<any>[]): boolean {
        const size = keys.length;
        for (let i = 0; i < size; i++) {
            if (this.attachments.has(keys[i].id)) {
                return true
            }
        }
        return false
    }
}
