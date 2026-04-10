export interface IDictionary<T> {
    Add(key: string, value: T);
    ContainsKey(key: string): boolean;
    Count(): number;
    Item(key: string): T;
    Keys(): string[];
    Remove(key: string): T;
    Values(): T[];
}

export class Dictionary<T> implements IDictionary<T> {
    private items: Record<string, T> = {};

    private count: number = 0;

    public ContainsKey(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.items, key);
    }

    public Count(): number {
        return this.count;
    }

    public Add(key: string, value: T) {
        if (!Object.prototype.hasOwnProperty.call(this.items, key)) this.count++;

        this.items[key] = value;
    }

    public Remove(key: string): T {
        const val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    }

    public Item(key: string): T {
        return this.items[key];
    }

    public Keys(): string[] {
        const keySet: string[] = [];

        for (const prop in this.items) {
            if (Object.prototype.hasOwnProperty.call(this.items, prop)) {
                keySet.push(prop);
            }
        }

        return keySet;
    }

    public Values(): T[] {
        const values: T[] = [];

        for (const prop in this.items) {
            if (Object.prototype.hasOwnProperty.call(this.items, prop)) {
                values.push(this.items[prop]);
            }
        }

        return values;
    }
}
