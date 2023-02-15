export interface IAttachmentKey<T> {
    readonly id: symbol;
    readonly marker: T;
}

export class AttachmentRegistry {
    private attachments = new Map<symbol, any>();

    public static createKey<T>(): IAttachmentKey<T> {
        return {
            id: Symbol(),
            marker: 0 as any,
        };
    }

    public putAttachment<T>(key: IAttachmentKey<T>, value: T): void {
        this.attachments.set(key.id, value);
    }

    public deleteAttachment<T>(key: IAttachmentKey<T>): void {
        this.attachments.delete(key.id);
    }

    public getAttachment<T>(key: IAttachmentKey<T>): T | null {
        return this.attachments.get(key.id);
    }

    public getAttachmentAssert<T>(key: IAttachmentKey<T>): T {
        if (!this.hasAttachment(key)) {
            throw new MissingAttachmentException();
        }
        return this.attachments.get(key.id);
    }

    public hasAttachment<T>(key: IAttachmentKey<T>): boolean {
        return this.attachments.has(key.id);
    }

    public hasAllAttachments(keys: IAttachmentKey<any>[]): boolean {
        const size = keys.length;
        for (let i = 0; i < size; i++) {
            if (!this.attachments.has(keys[i].id)) {
                return false;
            }
        }
        return true;
    }

    public hasAnyAttachments(keys: IAttachmentKey<any>[]): boolean {
        const size = keys.length;
        for (let i = 0; i < size; i++) {
            if (this.attachments.has(keys[i].id)) {
                return true;
            }
        }
        return false;
    }
}

export class MissingAttachmentException extends Error {
    public name = 'MissingAttachmentException';

    constructor() {
        super("Required attachment was missing from registry");
    }
}
