export class LocalStore {
    private static instance: LocalStore;
    private state: Record<string, any>;

    private constructor() {
        this.state = {};
    }

    public static getInstance(): LocalStore {
        if (!LocalStore.instance) {
            LocalStore.instance = new LocalStore();
        }
        return LocalStore.instance;
    }

    public setValue(key: string, value: string): void {
        this.state[key] = value;
    }

    public getValue(key: string): void {
        return this.state[key];
    }

    public removeValue(key: string): void {
        delete this.state[key];
    }

    public clearState(): void {
        this.state = {};
    }

    public getState() {
        return this.state;
    }
}