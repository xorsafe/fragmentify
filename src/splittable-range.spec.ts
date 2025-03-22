import { SplittableRange } from './splittable-range';
import { Block } from './types';
import { BaseCloner } from './split-distribution';

describe('SplittableRange', () => {
    let range: SplittableRange;

    beforeEach(() => {
        range = new SplittableRange(BaseCloner);
    });

    it('should be created', () => {
        expect(range).toBeTruthy();
    });

    it('should construct blocks from splits', () => {
        range.constructFromSplits(8, 0, 100);
        expect(range.getBlockCount()).toBe(8);
        expect(range.isContiguous()).toBeTruthy();
        expect(range.hasSortedIndices()).toBeTruthy();
        expect(range.getStart()).toBe(0);
        expect(range.getEnd()).toBe(100);
    });

    it('should change block size', () => {
        range.constructFromSplits(4, 0, 100);  // Creates blocks of size 25
        const blockIndex = 1;
        const originalBlock = range.getBlock(blockIndex);
        const originalStart = originalBlock.start;  // 25
        const originalEnd = originalBlock.end;      // 50
        
        range.changeBlockSize(blockIndex, true, 10, 0, 100);
        expect(range.getBlock(blockIndex).start).toBe(35);
        
        range.changeBlockSize(blockIndex, false, -10, 0, 100);
        expect(range.getBlock(blockIndex).end).toBe(40);
    });

    it('should apply a block', () => {
        range.constructFromSplits(4, 0, 100);
        const newBlock: Block = {
            start: 25,
            end: 50,
            index: -1
        };
        
        range.apply(newBlock);
        expect(range.getBlockCount()).toBe(4);
        expect(range.isContiguous()).toBeTruthy();
        expect(range.hasSortedIndices()).toBeTruthy();
    });

    it('should remove a block', () => {
        range.constructFromSplits(4, 0, 100);
        const blockIndex = 1;
        
        range.remove(blockIndex);
        expect(range.getBlockCount()).toBe(3);
        expect(range.isContiguous()).toBeTruthy();
        expect(range.hasSortedIndices()).toBeTruthy();
    });

    it('should merge blocks', () => {
        range.constructFromSplits(4, 0, 100);
        const blockIndex = 1;
        
        range.merge(blockIndex, true);
        expect(range.getBlockCount()).toBe(3);
        expect(range.isContiguous()).toBeTruthy();
        expect(range.hasSortedIndices()).toBeTruthy();
    });

    it('should move picker through blocks', () => {
        range.constructFromSplits(4, 0, 100);  // Creates blocks of size 25
        let [picker, currentIndex] = [0, 0];
        
        // First move should stay in the first block (0-25)
        [picker, currentIndex] = range.move(picker, 10, currentIndex);
        expect(picker).toBe(10);
        expect(currentIndex).toBe(0);
        
        // Second move should go to the third block (50-75)
        [picker, currentIndex] = range.move(picker, 50, currentIndex);
        expect(picker).toBe(60);
        expect(currentIndex).toBe(2);
    });

    it('should handle edge cases', () => {
        // Empty range
        expect(range.getBlockCount()).toBe(0);
        expect(range.getStart()).toBe(0);
        expect(range.getEnd()).toBe(0);
        
        // Single block
        const singleBlock: Block = {
            start: 0,
            end: 100,
            index: 0
        };
        range.apply(singleBlock);
        expect(range.getBlockCount()).toBe(1);
        expect(range.getStart()).toBe(0);
        expect(range.getEnd()).toBe(100);
        
        // Remove last block
        range.remove(0);
        expect(range.getBlockCount()).toBe(0);
    });

    it('should maintain block references', () => {
        range.constructFromSplits(4, 0, 100);
        const blocks = range.getBlocks();
        
        blocks.forEach(block => {
            expect(block.range).toBe(range); // Back reference is optional
        });
    });
}); 