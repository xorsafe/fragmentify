import { Block, BlockCloneMismatchError, CloneBlock } from './types';
import { variableUnevenDistribution, isArraySortedAscendingAndContinuous, areBlocksContiguous } from './utils';

/**
 * A class that represents a range that can be split into blocks
 */
export class SplittableRange {
    private blocks: Block[] = [];
    private cloner: CloneBlock;

    constructor(cloner: CloneBlock) {
        this.cloner = cloner;
    }

    /**
     * Gets the current blocks in the range
     */
    getBlocks(): Block[] {
        return this.blocks;
    }

    /**
     * Gets a block by its index
     */
    getBlock(index: number): Block {
        if (index < 0 || index >= this.blocks.length) {
            throw new Error("Index out of bounds");
        }
        return this.blocks[index];
    }

    /**
     * Gets the first block in the range
     */
    getFirstBlock(): Block | null {
        return this.blocks[0] || null;
    }

    /**
     * Gets the last block in the range
     */
    getLastBlock(): Block | null {
        return this.blocks[this.blocks.length - 1] || null;
    }

    /**
     * Gets the total number of blocks
     */
    getBlockCount(): number {
        return this.blocks.length;
    }

    /**
     * Gets the start of the range
     */
    getStart(): number {
        return this.getFirstBlock()?.start ?? 0;
    }

    /**
     * Gets the end of the range
     */
    getEnd(): number {
        return this.getLastBlock()?.end ?? 0;
    }

    /**
     * Checks if a block is valid
     */
    private isValid(block: Block): boolean {
        if (block.start >= block.end) {
            throw new Error("Block start must be less than block end");
        }
        return true;
    }

    /**
     * Checks if two blocks are overlapping
     */
    private areOverlapping(a: Block, b: Block): boolean {
        if (this.isValid(a) && this.isValid(b)) {
            return (b.start >= a.start && b.start < a.end) ||
                (a.start >= b.start && a.start < b.end);
        }
        return false;
    }

    /**
     * Checks if the cloned object satisfies the basic parameters
     */
    private cloneCheck(main: Block, cloned: Block): boolean {
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
     * Shifts the indices of all blocks starting at a particular index
     */
    private shiftBlocks(from: number, by: number): void {
        for (let i = from; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            block.index += by;
        }
    }

    /**
     * Changes the size of a block by a certain amount
     */
    changeBlockSize(blockIndex: number, fromStart: boolean, by: number, low: number, high: number): void {
        const block = this.getBlock(blockIndex);
        const cloned = {...block, range: this};

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

        this.blocks[blockIndex] = cloned;
    }

    /**
     * Applies a block to the range
     */
    apply(block: Block): void {
        if (this.blocks.length === 0) {
            block.index = 0;
            block.range = this;
            this.blocks = [block];
            return;
        }

        if (this.blocks.find(v => v == block) != null) {
            throw new Error("Block already exists in the range");
        }

        const firstBlock = this.getFirstBlock()!;
        const lastBlock = this.getLastBlock()!;
        if (block.start < firstBlock.start || block.end > lastBlock.end) {
            throw new Error("Block to insert is crossing the borders of the range");
        }

        // Find the blocks that overlap with the new block
        const overlappingBlocks: number[] = [];
        for (let i = 0; i < this.blocks.length; i++) {
            const thisBlock = this.blocks[i];
            if (block.start < thisBlock.end && block.end > thisBlock.start) {
                overlappingBlocks.push(i);
            }
        }

        if (overlappingBlocks.length === 0) {
            throw new Error("Block must overlap with existing blocks to maintain continuity");
        }

        const startBlockIndex = overlappingBlocks[0];
        const endBlockIndex = overlappingBlocks[overlappingBlocks.length - 1];

        const patched: Block[] = [];

        // Add blocks before the overlap
        for (let i = 0; i < startBlockIndex; i++) {
            patched.push({...this.blocks[i], index: i, range: this});
        }

        // Handle start block if needed
        const startBlock = this.blocks[startBlockIndex];
        if (block.start > startBlock.start) {
            patched.push({
                start: startBlock.start,
                end: block.start,
                index: patched.length,
                range: this
            });
        }

        // Add the new block
        patched.push({...block, index: patched.length, range: this});

        // Handle end block if needed
        const endBlock = this.blocks[endBlockIndex];
        if (block.end < endBlock.end) {
            patched.push({
                start: block.end,
                end: endBlock.end,
                index: patched.length,
                range: this
            });
        }

        // Add remaining blocks
        for (let i = endBlockIndex + 1; i < this.blocks.length; i++) {
            patched.push({...this.blocks[i], index: patched.length, range: this});
        }

        this.blocks = patched;
    }

    /**
     * Removes a block from the range
     */
    remove(blockIndex: number, replaceRatio: number = 0.5): void {
        const block = this.getBlock(blockIndex);
        if (this.blocks.length === 1) {
            this.blocks = [];
            return;
        }

        if (blockIndex === 0) {
            this.blocks.splice(0, 1);
            this.blocks[0].start = block.start;
            this.shiftBlocks(0, -1);
        } else if (blockIndex === this.blocks.length - 1) {
            this.blocks.splice(this.blocks.length - 1, 1);
            this.blocks[this.blocks.length - 1].end = block.end;
        } else {
            const prior = this.blocks[blockIndex - 1];
            const post = this.blocks[blockIndex + 1];
            const span = post.start - prior.end;
            const extension = replaceRatio * span;
            prior.end += extension;
            post.start = prior.end;
            this.blocks.splice(blockIndex, 1);
            this.shiftBlocks(blockIndex, -1);
        }
    }

    /**
     * Merges a block with its adjacent block
     */
    merge(blockIndex: number, withPrevious: boolean): void {
        if (blockIndex < 0 || blockIndex >= this.blocks.length) {
            throw new Error("Index is out of bounds for the range");
        } else if (blockIndex === 0 && withPrevious) {
            throw new Error("Cannot merge with previous if this is the starting block");
        } else if (blockIndex === this.blocks.length - 1 && !withPrevious) {
            throw new Error("Cannot merge with next if this is the last block");
        }

        if (withPrevious) {
            this.blocks[blockIndex - 1].end = this.blocks[blockIndex].end;
        } else {
            this.blocks[blockIndex + 1].start = this.blocks[blockIndex].start;
        }
        this.blocks.splice(blockIndex, 1);
        this.shiftBlocks(blockIndex, -1);
    }

    /**
     * Moves a picker through the range
     */
    move(picker: number, delta: number, currentBlockIndex: number): [number, number] {
        const firstBlock = this.getFirstBlock();
        const lastBlock = this.getLastBlock();
        if (!firstBlock || !lastBlock) {
            throw new Error("Range is empty");
        }

        const low = firstBlock.start;
        const high = lastBlock.end;

        if (picker < firstBlock.start) {
            throw new Error("Old picker state is less than start of the range");
        } else if (picker >= lastBlock.end) {
            throw new Error("Old picker state is greater than end of the range");
        }

        const newPickerState = picker + delta;
        if (newPickerState < low) {
            return [low, 0];
        } else if (newPickerState >= high) {
            return [high - 1, this.blocks.length - 1];
        }

        // First check if we're still in the current block
        const currentBlock = this.blocks[currentBlockIndex];
        if (newPickerState >= currentBlock.start && newPickerState < currentBlock.end) {
            return [newPickerState, currentBlockIndex];
        }

        // If moving forward, search from current block onwards
        if (delta > 0) {
            for (let i = currentBlockIndex + 1; i < this.blocks.length; i++) {
                const block = this.blocks[i];
                if (newPickerState >= block.start && newPickerState < block.end) {
                    return [newPickerState, i];
                }
            }
        }
        // If moving backward, search from current block backwards
        else {
            for (let i = currentBlockIndex - 1; i >= 0; i--) {
                const block = this.blocks[i];
                if (newPickerState >= block.start && newPickerState < block.end) {
                    return [newPickerState, i];
                }
            }
        }

        // If we haven't found a block, do a full search
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            if (newPickerState >= block.start && newPickerState < block.end) {
                return [newPickerState, i];
            }
        }

        return [high - 1, this.blocks.length - 1];
    }

    /**
     * Constructs blocks from a given number of splits
     */
    constructFromSplits(totalSplits: number, low: number = 0, high: number = 100): void {
        const range = high - low;
        const blockSize = Math.floor(range / totalSplits);
        const blocks: Block[] = [];
        
        for (let i = 0; i < totalSplits - 1; i++) {
            blocks.push({
                start: low + (i * blockSize),
                end: low + ((i + 1) * blockSize),
                index: i,
                range: this
            });
        }
        
        // Last block takes the remainder
        blocks.push({
            start: low + ((totalSplits - 1) * blockSize),
            end: high,
            index: totalSplits - 1,
            range: this
        });
        
        this.blocks = blocks;
    }

    /**
     * Creates blocks from an array of splits
     */
    private fromSplitsToContiguousBlocks(start: number, ...splits: number[]): Block[] {
        const blocks: Block[] = [];
        let currentStart = start;
        let index = 0;

        for (const split of splits) {
            const block: Block = {
                start: currentStart,
                end: currentStart + split,
                index: index++
            };
            blocks.push(block);
            currentStart = block.end;
        }

        return blocks;
    }

    /**
     * Checks if the blocks are contiguous
     */
    isContiguous(): boolean {
        return areBlocksContiguous(this.blocks);
    }

    /**
     * Checks if the block indices are sorted and continuous
     */
    hasSortedIndices(): boolean {
        const indices = this.blocks.map(b => b.index);
        return isArraySortedAscendingAndContinuous(indices);
    }
} 