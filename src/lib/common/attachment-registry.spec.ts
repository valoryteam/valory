import {AttachmentKey, AttachmentRegistry} from "./attachment-registry";

test("should create a key", () => {
    const key = AttachmentRegistry.createKey();
    expect(key).toHaveProperty("id");
});

test("should add and retrieve attachment", () => {
    const reg = new AttachmentRegistry();
    const value = {stuff: true};
    const key = AttachmentRegistry.createKey<typeof value>();
    reg.putAttachment(key, value);
    expect(reg.getAttachment(key)).toStrictEqual(value);
});

test("should delete an attachment", () => {
    const reg = new AttachmentRegistry();
    const value = {stuff: true};
    const key = AttachmentRegistry.createKey<typeof value>();
    reg.putAttachment(key, value);
    expect(reg.getAttachment(key)).toStrictEqual(value);
    reg.deleteAttachment(key);
    expect(reg.getAttachment(key)).toBe(undefined);
});

describe("should check for keys", () => {
    const reg = new AttachmentRegistry();
    const key1 = AttachmentRegistry.createKey();
    const key2 = AttachmentRegistry.createKey();
    const key3 = AttachmentRegistry.createKey();
    reg.putAttachment(key1, "stuff");
    reg.putAttachment(key2, "things");

    test("should check for single key", () => {
        expect(reg.hasAttachment(key1)).toBe(true);
    });

    test("should check for single key missing", () => {
        expect(reg.hasAttachment(key3)).toBe(false);
    });

    test("should check for all keys", () => {
        expect(reg.hasAllAttachments([key1, key2])).toBe(true);
    });

    test("should check for all keys missing", () => {
        expect(reg.hasAllAttachments([key1, key2, key3])).toBe(false);
    });

    test("should check for any keys", () => {
        expect(reg.hasAnyAttachments([key1, key2, key3])).toBe(true);
    });

    test("should check for any keys all missing", () => {
        expect(reg.hasAnyAttachments([key3])).toBe(false);
    });
});
