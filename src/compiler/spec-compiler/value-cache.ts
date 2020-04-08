import {sha1String} from "../../lib/common/util";

interface ValueCacheEntry {
    content: string;
    hash: string;
    usages: number;
}

export class ValueCache {
    private cache: {[hash: string]: ValueCacheEntry} = {};

    private static generateName(value: string) {
        return "c" + sha1String(value);
    }

    private static shouldPreventInline(entry: ValueCacheEntry): boolean {
        return entry.usages > 1;
    }

    public add(value: string): string {
        const hash = ValueCache.generateName(value);
        let cacheEntry = this.cache[hash];
        if (cacheEntry == null) {
            cacheEntry = {
                content: value,
                usages: 1,
                hash
            };
        } else {
            cacheEntry.usages++;
        }
        this.cache[hash] = cacheEntry;
        return hash;
    }

    public generate() {
        let code = "";
        for (const hash in this.cache) {
            const entry = this.cache[hash];
            const inline = (ValueCache.shouldPreventInline(entry)) ? "/** @noinline */" : "";
            code += `${inline} const ${hash} = ${entry.content};\n`;
        }
        return code;
    }
}
