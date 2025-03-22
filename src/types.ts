/** Generic block that defines where it exists in the range of the split distribution */
export interface Block {
    /** Starting value on the range */
    start: number;
    /** Ending value on the range */
    end: number;
    /** Index in the main array that holds it */
    index: number;
}

/** Callback to clone a block */
export type CloneBlock = (block: Block) => Block;

/** Custom Error for mismatching blocks */
export class BlockCloneMismatchError extends Error {
    constructor(private main: Block, private clone: Block, private mismatch: 'start' | 'end' | 'index') {
        super();
    }

    override get message(): string {
        if (this.mismatch == 'start') {
            return `The start limits of the cloned object(${this.clone.start}) does not match the start of existing(${this.main.start})`
        } else if (this.mismatch == 'end') {
            return `The end limits of the cloned object(${this.clone.end}) does not match the end of existing(${this.main.end})`
        } else if (this.mismatch == 'index') {
            return `The start limits of the cloned object(${this.clone.index}) does not match the start of existing(${this.main.index})`
        }
        return 'The 2 objects are perfectly match';
    }
} 