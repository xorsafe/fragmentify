import { SplittableRange } from './splittable-range';

/** Generic block that defines where it exists in the range of the split distribution */
export interface Block {
    /** Starting value on the range */
    start: number;
    /** Ending value on the range */
    end: number;
    /** Index in the main array that holds it */
    index: number;
    range?: SplittableRange;  // Back reference to the range this block belongs to
}

/** Callback to clone a block */
export type CloneBlock = (block: Block) => Block;

/** Custom Error for mismatching blocks */
export class BlockCloneMismatchError extends Error {
    constructor(
        public main: Block,
        public cloned: Block,
        public property: keyof Block
    ) {
        super(`Cloned block ${property} mismatch: ${main[property]} != ${cloned[property]}`);
        this.name = 'BlockCloneMismatchError';
    }
} 