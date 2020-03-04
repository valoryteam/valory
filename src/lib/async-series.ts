export type AsyncFunctor<T> = (arg: T) => Promise<any> | any

export class AsyncSeries<T> {
    private readonly functionNum: number;
    private functions: {function: AsyncFunctor<T>, priority: number}[];

    constructor(
        functions: {function: AsyncFunctor<T>, priority: number}[],
        private iterator: (arg: T, i: number) => void,
        private exceptionHandler: (arg: T, err: Error, i: number) => void,
    ) {
        this.functionNum = functions.length;
        this.functions = functions.sort((a, b) => a.priority - b.priority)
    }

    public async execute(arg: T) {
        for (let i = 0; i < this.functionNum; i++) {
            try {
                this.iterator(arg, i);
                await this.functions[i].function(arg)
            } catch (e) {
                this.exceptionHandler(arg, e, i);
            }
        }
    }
}
