import { Block, BlockCloneMismatchError, CloneBlock } from './types';
import { variableUnevenDistribution } from './utils';

/** A simple cloner that only replicates base interface properties */
export const BaseCloner: CloneBlock = b => ({
    start: b.start,
    end: b.end,
    index: b.index
});

/** Service used to manipulate a range into a split of unevenly distributed blocks */
export class SplitDistribution {
    /**
     * Moves an assumed picker across the entire length of the range.
     * @param picker The current value that the picker was at before
     * @param delta The amount to move by
     * @param current The current block
     * @param array The main array of blocks
     * @returns Tuple containing new picker value and the new block(will be the same block if didn't change)
     */
    move(picker: number, delta: number, current: Block, array: Block[]): [number, Block] {
        const firstBlock = array[0];
        const lastBlock = array[array.length - 1];
        const low = firstBlock.start;
        const high = lastBlock.end;

        if (picker < firstBlock.start) {
            throw new Error("Old picker state is less than start of the range")
        } else if (picker >= lastBlock.end) {
            throw new Error("Old picker state is greater than end of the range")
        }

        const newPickerState = picker + delta;
        if (newPickerState < low) {
            return [low, array[0]]
        } else if (newPickerState >= high) {
            return [high - 1, lastBlock];
        } else if (newPickerState >= current.start && newPickerState < current.end) {
            return [newPickerState, current];
        } else {
            let cursor = current.index;
            while (cursor < array.length) {
                const thisBlock = array[cursor];
                if (this.isPickerInBlock(newPickerState, thisBlock)) {
                    return [newPickerState, thisBlock];
                }
                cursor++;
            }
            return [high - 1, lastBlock]
        }
    }

    /**
     * Immutably changes a block size and returns a new block
     */
    changeBlockSize(block: Block, fromStart: boolean, by: number, clone: CloneBlock, low: number, high: number): Block {
        const cloned = clone(block);
        this.cloneCheck(block, cloned);
        if (fromStart) {
            const newStart = cloned.start + by;
            if (newStart < low) {
                cloned.start = low;
            } else if (newStart >= cloned.end) {
                cloned.start = cloned.end - 1;
            } else {
                cloned.start = newStart;
            }
        } else {
            const newEnd = cloned.end + by;
            if (newEnd >= high) {
                cloned.end = high;
            } else if (newEnd <= cloned.start) {
                cloned.end = cloned.start + 1;
            } else {
                cloned.end = newEnd;
            }
        }
        return cloned;
    }

    /**
     * Checks if the cloned object satisfies the basic parameters
     */
    cloneCheck(main: Block, cloned: Block): boolean {
        if (cloned.start != main.start) {
            throw new BlockCloneMismatchError(main, cloned, 'start');
        } else if (cloned.end != main.end) {
            throw new BlockCloneMismatchError(main, cloned, 'end');
        } else if (cloned.index != main.index) {
            throw new BlockCloneMismatchError(main, cloned, 'index');
        }
        return true;
    }

    /**
     * Applies a block onto an existing array
     */
    apply(block: Block, array: Block[]): Block[] {
        if (array == null || array.length == 0) {
            return [block];
        } else if (array.find(v => v == block) != null) {
            throw new Error("Block already exist in the array");
        } else if (block.start < array[0].start || block.end > array[array.length - 1].end) {
            throw new Error("Block to insert is crossing the borders of the range")
        }

        let startingBlockIndex = 0;
        let endingBlockIndex = 0;
        for (let i = 0; i < array.length; i++) {
            const thisBlock = array[i];
            if (block.start >= thisBlock.start) {
                startingBlockIndex = i;
            }

            if (block.end >= thisBlock.end) {
                endingBlockIndex = i;
            }
        }

        if(endingBlockIndex!=array.length-1){
            endingBlockIndex++;
        }

        const patched: Block[] = [];

        const overlappingStartingBlock = array[startingBlockIndex];
        if ((block.start - overlappingStartingBlock.start) > 0) {
            overlappingStartingBlock.end = block.start;
        }

        const overlappingEndingBlock = array[endingBlockIndex];
        const leftoverBlocksIndexResume = endingBlockIndex+1;
        if ((overlappingEndingBlock.end - block.end) > 0) {
            overlappingEndingBlock.start = block.end;
        }

        let index = 0;
        while (index < startingBlockIndex) {
            const thisBlock = array[index];
            patched.push(thisBlock);
            thisBlock.index = index;
            index++;
        }

        if ((block.start - overlappingStartingBlock.start) > 0) {
            patched.push(overlappingStartingBlock);
            overlappingStartingBlock.index = index;
            index++;
        }

        block.index = index;
        patched.push(block);
        index++;

        if ((overlappingEndingBlock.end - block.end) > 0) {
            patched.push(overlappingEndingBlock);
            overlappingEndingBlock.index = index;
            index++;
        }

        let leftoverIndex = leftoverBlocksIndexResume;
        while(leftoverIndex<array.length){
            const thisBlock = array[leftoverIndex];
            patched.push(thisBlock);
            thisBlock.index = index;
            index++;
            leftoverIndex++;
        }

        return patched;
    }

    /**
     * Removes a block from an existing array
     */
    remove(block: Block, array: Block[], replaceRatio: number = 0.5): Block[] | null {
        if (array.find(v => v == block) == null) {
            throw new Error("Block doesn't exist in the array in the first place");
        }
        if (array.length == 1) {
            return null;
        } else if (block.index == 0) {
            array.splice(0, 1);
            array[0].start = block.start;
            this.shiftBlocks(0, -1, array);
            return array;
        } else if (block.index == array.length - 1) {
            array.splice(array.length - 1, 1);
            array[array.length - 1].end = block.end;
            return array;
        } else {
            const prior = array[block.index - 1];
            const post = array[block.index + 1];
            const span = post.start - prior.end;
            const extension = replaceRatio * span;
            prior.end += extension;
            post.start = prior.end;
            array.splice(block.index, 1);
            this.shiftBlocks(block.index, -1, array);
            return array;
        }
    }

    /**
     * Shifts the indices of all blocks starting at a particular index
     */
    private shiftBlocks(from: number, by: number, array: Block[]) {
        for (let i = from; i < array.length; i++) {
            const block = array[i];
            block.index += by;
        }
    }

    /**
     * Merges a block in an existing array with its adjacent block
     */
    merge(index: number, withPrevious: boolean, array: Block[]): Block[] {
        if (index<0 || index >=array.length) {
            throw new Error("Index is out of bounds for the given array");
        } else if(index==0 && withPrevious){
            throw new Error("Cannot merge with previous if this is the starting block");
        } else if(index==array.length-1 && !withPrevious){
            throw new Error("Cannot merge with next if this is the last block");
        }

        if(withPrevious){
            array[index-1].end=array[index].end;
        }else{
            array[index+1].start=array[index].start;
        }
        array.splice(index,1);
        this.shiftBlocks(index,-1,array);

        return array;
    }

    /**
     * Reports if two blocks are overlapping or not
     */
    areOverlapping(a: Block, b: Block): boolean {
        if (this.isValid(a) && this.isValid(b)) {
            return (b.start >= a.start && b.start < a.end) ||
                (a.start >= b.start && a.start < b.end);
        } else {
            return false;
        }
    }

    /**
     * Checks if the block is valid or not
     */
    isValid(block: Block): boolean {
        if (block.start >= block.end) {
            throw new Error("Block start needs to be less than end")
        }
        return true;
    }

    /**
     * Constructs a list of contiguous blocks from a given number of splits
     */
    constructContiguousBlocksFrom(totalSplits: number, low: number = 0, high: number = 100): Block[] {
        const splits = variableUnevenDistribution(high - low, totalSplits);
        return this.fromSplitsToContiguousBlocks(low, ...splits);
    }

    /**
     * Creates blocks from an array of block sizes
     */
    fromSplitsToContiguousBlocks(start: number, ...splits: number[]): Block[] {
        if (splits.length == 0) {
            return []
        } else if (splits.length == 1) {
            return [
                {
                    start: start,
                    end: start + splits[0],
                    index: 0
                }
            ]
        }
        let cursor = start;
        const blocks: Block[] = [];
        for (let i = 0; i < splits.length; i++) {
            const split = splits[i];
            blocks.push({
                start: cursor,
                end: cursor + split,
                index: i
            })
            cursor += split
        }

        return blocks;
    }

    /**
     * Checks if the picker is inside this block or not
     */
    isPickerInBlock(picker: number, block: Block): boolean {
        return picker >= block.start && picker < block.end;
    }
} 