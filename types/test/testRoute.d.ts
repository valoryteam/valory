export declare class TestRoute {
    test(authorization: string): {
        message: string;
    };
    submit(item: {
        name: string;
        isCool: boolean;
    }): string;
    error(): void;
}
