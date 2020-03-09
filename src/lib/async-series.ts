export type AsyncFunctor<T> = (arg: T) => Promise<any> | any

export class AsyncSeries<T, K extends {handler: AsyncFunctor<T>}> {
    private readonly functionNum: number;

    constructor(
        private functions: K[],
        private iterator: (arg: T, i: number) => void,
        private exceptionHandler: (arg: T, err: Error, i: number) => void,
    ) {
        this.functionNum = functions.length;
        // this.functions = functions.sort((a, b) => b.priority - a.priority)
    }

    public async execute(arg: T) {
        for (let i = 0; i < this.functionNum; i++) {
            try {
                this.iterator(arg, i);
                await this.functions[i].handler(arg)
            } catch (e) {
                this.exceptionHandler(arg, e, i);
            }
        }
    }
}
