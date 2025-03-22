import { SplitDistribution, BaseCloner } from './split-distribution';
import { Block, BlockCloneMismatchError } from './types';
import { isArraySortedAscendingAndContinuous, areBlocksContiguous } from './utils';

describe('SplitDistribution', () => {
    let service: SplitDistribution;

    beforeEach(() => {
        service = new SplitDistribution();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("should check if a block is valid or not", () => {
        const positive: Block = {
            start: 20,
            end: 30,
            index: 2
        }
        expect(service.isValid(positive)).toBeTruthy();
        const negative: Block = {
            start: 100,
            end: 30,
            index: 1
        }
        expect(() => service.isValid(negative)).toThrow();
    });

    it("should check if 2 blocks are overlapping or not", () => {
        const a: Block = {
            start: 50,
            end: 80,
            index: 2
        }
        const b: Block = {
            start: 60,
            end: 70,
            index: 1
        }
        const c: Block = {
            start: 90,
            end: 95,
            index: 1
        }
        expect(service.areOverlapping(a, b)).toBeTruthy();
        expect(service.areOverlapping(a, c)).toBeFalsy();
    });

    it("should check cloned object for equality", () => {
        const main: Block = {
            start: 50,
            end: 80,
            index: 2
        }

        const perfectClone = BaseCloner(main);
        expect(service.cloneCheck(main, perfectClone)).toBeTruthy();

        const startMismatch: Block = {
            start: main.start + 10,
            end: main.end,
            index: main.index
        }
        expect(() => service.cloneCheck(main, startMismatch)).toThrow(BlockCloneMismatchError);

        const endMismatch: Block = {
            start: main.start,
            end: main.end + 10,
            index: main.index
        }
        expect(() => service.cloneCheck(main, endMismatch)).toThrow(BlockCloneMismatchError);

        const indexMismatch: Block = {
            start: main.start,
            end: main.end,
            index: main.index + 1
        }
        expect(() => service.cloneCheck(main, indexMismatch)).toThrow(BlockCloneMismatchError);
    });

    it("should change block size by a certain amount", () => {
        const low = 10;
        const high = 90;

        const main: Block = {
            start: 50,
            end: 80,
            index: 2
        }
        let changed: Block;
        // from start:
        // regular case 
        changed = service.changeBlockSize(main, true, -10, BaseCloner, low, high);
        expect(changed.start).toBe(40);
        expect(changed.end).toBe(80);
        expect(changed.index).toBe(2);

        changed = service.changeBlockSize(changed, true, 20, BaseCloner, low, high);
        expect(changed.start).toBe(60);
        expect(changed.end).toBe(80);
        expect(changed.index).toBe(2);

        // touching end
        changed = service.changeBlockSize(changed, true, 60, BaseCloner, low, high);
        expect(changed.start).toBe(79);
        expect(changed.end).toBe(80);
        expect(changed.index).toBe(2);

        // from end:
        // regular case 
        changed = service.changeBlockSize(changed, false, 5, BaseCloner, low, high);
        expect(changed.start).toBe(79);
        expect(changed.end).toBe(85);
        expect(changed.index).toBe(2);

        changed = service.changeBlockSize(changed, false, -3, BaseCloner, low, high);
        expect(changed.start).toBe(79);
        expect(changed.end).toBe(82);
        expect(changed.index).toBe(2);

        // edging end
        changed = service.changeBlockSize(changed, false, 60, BaseCloner, low, high);
        expect(changed.start).toBe(79);
        expect(changed.end).toBe(90);
        expect(changed.index).toBe(2);

        // touching start
        changed = service.changeBlockSize(changed, false, -50, BaseCloner, low, high);
        expect(changed.start).toBe(79);
        expect(changed.end).toBe(80);
        expect(changed.index).toBe(2);
    });

    it("should apply a block in an array", () => {
        const solo = {
            start: 10,
            end: 90,
            index: 0
        }

        const solo1 = service.apply(solo, []);
        const soloNull = service.apply(solo, []);

        expect(solo1[0]).toBe(solo);
        expect(soloNull[0]).toBe(solo);

        const l1 = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
        // (10,20), (20,40), (40,70), (70,110), (110,170),

        // throw an error if the block already exists in the array
        expect(() => service.apply(l1[2], l1)).toThrow();

        // throw an error if the block is beyond the limits of the range
        const tooEarly = {
            start: 5,
            end: 90,
            index: -1
        }
        expect(() => service.apply(tooEarly, l1)).toThrow();

        const tooLate = {
            start: 5,
            end: 95,
            index: -1
        }
        expect(() => service.apply(tooLate, l1)).toThrow();

        // first
        const first: Block = {
            start: 10,
            end: 20,
            index: -1
        }

        const l2 = service.apply(first, l1);
        expect(l2.length).toBe(5);
        expect(l2[0]).toBe(first);
        expect(first.index).toBe(0);
        expect(l2[1].start).toBe(20);
        expect(l2[1].end).toBe(40);
        expect(l2[1].index).toBe(1);
        expect(l2[2].start).toBe(40);
        expect(l2[2].end).toBe(70);
        expect(l2[2].index).toBe(2);
        expect(l2[3].start).toBe(70);
        expect(l2[3].end).toBe(110);
        expect(l2[3].index).toBe(3);
        expect(l2[4].start).toBe(110);
        expect(l2[4].end).toBe(170);
        expect(l2[4].index).toBe(4);

        // last
        const last: Block = {
            start: 110,
            end: 170,
            index: -1
        }

        const l3 = service.apply(last, l2);
        expect(l3.length).toBe(5);
        expect(l3[0].start).toBe(10);
        expect(l3[0].end).toBe(20);
        expect(l3[0].index).toBe(0);
        expect(l3[1].start).toBe(20);
        expect(l3[1].end).toBe(40);
        expect(l3[1].index).toBe(1);
        expect(l3[2].start).toBe(40);
        expect(l3[2].end).toBe(70);
        expect(l3[2].index).toBe(2);
        expect(l3[3].start).toBe(70);
        expect(l3[3].end).toBe(110);
        expect(l3[3].index).toBe(3);
        expect(l3[4]).toBe(last);
        expect(last.index).toBe(4);

        // middle
        const middle: Block = {
            start: 40,
            end: 70,
            index: -1
        }

        const l4 = service.apply(middle, l3);
        expect(l4.length).toBe(5);
        expect(l4[0].start).toBe(10);
        expect(l4[0].end).toBe(20);
        expect(l4[0].index).toBe(0);
        expect(l4[1].start).toBe(20);
        expect(l4[1].end).toBe(40);
        expect(l4[1].index).toBe(1);
        expect(l4[2]).toBe(middle);
        expect(middle.index).toBe(2);
        expect(l4[3].start).toBe(70);
        expect(l4[3].end).toBe(110);
        expect(l4[3].index).toBe(3);
        expect(l4[4].start).toBe(110);
        expect(l4[4].end).toBe(170);
        expect(l4[4].index).toBe(4);

        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            // offset first
            const offsetFirst: Block = {
                start: 15,
                end: 25,
                index: -1
            }

            const o = service.apply(offsetFirst, l);
            
            expect(o.length).toBe(6);
            expect(o[0].start).toBe(10);
            expect(o[0].end).toBe(15);
            expect(o[0].index).toBe(0);
            expect(o[1]).toBe(offsetFirst);
            expect(offsetFirst.index).toBe(1);
            expect(o[2].start).toBe(25);
            expect(o[2].end).toBe(40);
            expect(o[2].index).toBe(2);
            expect(o[3].start).toBe(40);
            expect(o[3].end).toBe(70);
            expect(o[3].index).toBe(3);
            expect(o[4].start).toBe(70);
            expect(o[4].end).toBe(110);
            expect(o[4].index).toBe(4);
            expect(o[5].start).toBe(110);
            expect(o[5].end).toBe(170);
            expect(o[5].index).toBe(5);
        }

        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            // offset last
            const offsetLast: Block = {
                start: 105,
                end: 125,
                index: -1
            }

            const o = service.apply(offsetLast, l);
            expect(o.length).toBe(6);
            expect(o[0].start).toBe(10);
            expect(o[0].end).toBe(20);
            expect(o[0].index).toBe(0);
            expect(o[1].start).toBe(20);
            expect(o[1].end).toBe(40);
            expect(o[1].index).toBe(1);
            expect(o[2].start).toBe(40);
            expect(o[2].end).toBe(70);
            expect(o[2].index).toBe(2);
            expect(o[3].start).toBe(70);
            expect(o[3].end).toBe(105);
            expect(o[3].index).toBe(3);
            expect(o[4]).toBe(offsetLast);
            expect(offsetLast.index).toBe(4);
            expect(o[5].start).toBe(125);
            expect(o[5].end).toBe(170);
            expect(o[5].index).toBe(5);
        }

        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            // big block in middle
            const middleSkippingFew: Block = {
                start: 25,
                end: 125,
                index: -1
            }

            const o = service.apply(middleSkippingFew, l);
            expect(o.length).toBe(4);
            expect(o[0].start).toBe(10);
            expect(o[0].end).toBe(20);
            expect(o[0].index).toBe(0);
            expect(o[1].start).toBe(20);
            expect(o[1].end).toBe(25);
            expect(o[1].index).toBe(1);
            expect(o[2]).toBe(middleSkippingFew);
            expect(middleSkippingFew.index).toBe(2);
            expect(o[3].start).toBe(125);
            expect(o[3].end).toBe(170);
            expect(o[3].index).toBe(3);
        }

        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            // whole thing
            const wholeThing: Block = {
                start: 10,
                end: 170,
                index: -1
            }

            const o = service.apply(wholeThing, l);
            expect(o.length).toBe(1);
            expect(o[0]).toBe(wholeThing);
            expect(wholeThing.index).toBe(0);
        }
    });

    it("should merge a block with an existing block resulting in a final block", () => {
        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            expect(() => service.merge(0, true, l)).toThrow();
            expect(() => service.merge(4, false, l)).toThrow();
        }
        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            const o = service.merge(1, true, l);
            expect(o.length).toBe(4);
            expect(o[0].start).toBe(10);
            expect(o[0].end).toBe(40);
            expect(o[0].index).toBe(0);
            expect(o[1].start).toBe(40);
            expect(o[1].end).toBe(70);
            expect(o[1].index).toBe(1);
            expect(o[2].start).toBe(70);
            expect(o[2].end).toBe(110);
            expect(o[2].index).toBe(2);
            expect(o[3].start).toBe(110);
            expect(o[3].end).toBe(170);
            expect(o[3].index).toBe(3);
        }
        {
            const l = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
            // (10,20), (20,40), (40,70), (70,110), (110,170),
            
            const o = service.merge(2, false, l);
            
            expect(o.length).toBe(4);
            expect(o[0].start).toBe(10);
            expect(o[0].end).toBe(20);
            expect(o[0].index).toBe(0);
            expect(o[1].start).toBe(20);
            expect(o[1].end).toBe(40);
            expect(o[1].index).toBe(1);
            expect(o[2].start).toBe(40);
            expect(o[2].end).toBe(110);
            expect(o[2].index).toBe(2);
            expect(o[3].start).toBe(110);
            expect(o[3].end).toBe(170);
            expect(o[3].index).toBe(3);
        }
    });

    it("should remove a block from an array", () => {
        const solo: Block[] = [
            {
                start: 10,
                end: 90,
                index: 0
            }
        ];

        expect(service.remove(solo[0], solo)).toBeNull();

        const l1 = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
        // (10,20), (20,40), (40,70), (70,110), (110,170),

        const outsider: Block = {
            start: 50,
            end: 80,
            index: 2
        }

        expect(() => service.remove(outsider, l1, 0.4)).toThrow();

        // middle case(deleting second block)
        const l2 = service.remove(l1[1], l1, 0.4);
        if (l2) {
            expect(l2.length).toBe(4);
            
            expect(l2[0].start).toBe(10);
            expect(l2[0].end).toBe(28);
            expect(l2[0].index).toBe(0);

            expect(l2[1].start).toBe(28);
            expect(l2[1].end).toBe(70);
            expect(l2[1].index).toBe(1);

            expect(l2[2].start).toBe(70);
            expect(l2[2].end).toBe(110);
            expect(l2[2].index).toBe(2);

            expect(l2[3].start).toBe(110);
            expect(l2[3].end).toBe(170);
            expect(l2[3].index).toBe(3);

            // last case(deleting last block)
            const l3 = service.remove(l2[3], l2, 0.4);
            if (l3) {
                expect(l3.length).toBe(3);

                expect(l3[0].start).toBe(10);
                expect(l3[0].end).toBe(28);
                expect(l3[0].index).toBe(0);

                expect(l3[1].start).toBe(28);
                expect(l3[1].end).toBe(70);
                expect(l3[1].index).toBe(1);

                expect(l3[2].start).toBe(70);
                expect(l3[2].end).toBe(170);
                expect(l3[2].index).toBe(2);

                // first case(deleting first block)
                const l4 = service.remove(l3[0], l3, 0.4);
                if (l4) {
                    expect(l4.length).toBe(2);

                    expect(l4[0].start).toBe(10);
                    expect(l4[0].end).toBe(70);
                    expect(l4[0].index).toBe(0);

                    expect(l4[1].start).toBe(70);
                    expect(l4[1].end).toBe(170);
                    expect(l4[1].index).toBe(1);
                }
            }
        }
    });

    it("should move the picker by a certain amount whilst maintaining the pointer to the current block", () => {
        const blocks = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
        // (10,20), (20,40), (40,70), (70,110), (110,170),

        let current = blocks[0];

        expect(() => service.move(0, 2, current, blocks)).toThrow();
        expect(() => service.move(180, 2, current, blocks)).toThrow();

        let picker = 10;

        // moving in the first block no change in cursor
        [picker, current] = service.move(picker, 2, current, blocks);
        expect(picker).toBe(12);
        expect(current).toBe(blocks[0]);

        // moving back should be allowed
        [picker, current] = service.move(picker, -5, current, blocks);
        expect(picker).toBe(10);
        expect(current).toBe(blocks[0]);

        // moving back past boundary resets at zero
        [picker, current] = service.move(picker, -50, current, blocks);
        expect(picker).toBe(10);
        expect(current).toBe(blocks[0]);

        // moving ahead by 12
        [picker, current] = service.move(picker, 12, current, blocks);
        expect(picker).toBe(22);
        expect(current).toBe(blocks[1]);

        // moving to the second block no change in cursor
        [picker, current] = service.move(picker, 10, current, blocks);
        expect(picker).toBe(32);
        expect(current).toBe(blocks[1]);

        // jump to fourth block by using a big delta
        [picker, current] = service.move(picker, 40, current, blocks);
        expect(picker).toBe(72);
        expect(current).toBe(blocks[3]);

        // rewinding back by a significant amount resets to zero
        [picker, current] = service.move(picker, -400, current, blocks);
        expect(picker).toBe(10);
        expect(current).toBe(blocks[0]);

        // fast forwarding by a significant amount sets to end
        [picker, current] = service.move(picker, 400, current, blocks);
        expect(picker).toBe(169);
        expect(current).toBe(blocks[4]);
    });

    it("should construct sorted contiguous blocks from a given amount of total splits", () => {
        const low = 0;
        const high = 100;
        const blocks = service.constructContiguousBlocksFrom(8, low, high);

        // check that the indices are ascending and contiguous
        const onlyIndices = blocks.map(v => v.index);
        expect(onlyIndices.length).toBeGreaterThan(0);
        expect(onlyIndices[0]).toBe(0);
        expect(isArraySortedAscendingAndContinuous(onlyIndices)).toBeTruthy();

        // check if the blocks are contiguous or not
        // also check that they start with low and end at high
        expect(blocks[0].start).toBe(low);
        expect(blocks[blocks.length - 1].end).toBe(high);
        expect(areBlocksContiguous(blocks)).toBeTruthy();
    });

    it("should construct a contiguously defined list of blocks from a given array of splits", () => {
        const atZero = service.fromSplitsToContiguousBlocks(0, 10, 20, 30, 40, 60);
        expect(atZero.length).toBe(5);
        expect(atZero[0].start).toBe(0);
        expect(atZero[0].end).toBe(10);
        expect(atZero[1].start).toBe(10);
        expect(atZero[1].end).toBe(30);
        expect(atZero[2].start).toBe(30);
        expect(atZero[2].end).toBe(60);
        expect(atZero[3].start).toBe(60);
        expect(atZero[3].end).toBe(100);
        expect(atZero[4].start).toBe(100);
        expect(atZero[4].end).toBe(160);

        const offset10 = service.fromSplitsToContiguousBlocks(10, 10, 20, 30, 40, 60);
        expect(offset10.length).toBe(5);
        expect(offset10[0].start).toBe(10);
        expect(offset10[0].end).toBe(20);
        expect(offset10[1].start).toBe(20);
        expect(offset10[1].end).toBe(40);
        expect(offset10[2].start).toBe(40);
        expect(offset10[2].end).toBe(70);
        expect(offset10[3].start).toBe(70);
        expect(offset10[3].end).toBe(110);
        expect(offset10[4].start).toBe(110);
        expect(offset10[4].end).toBe(170);
    });
}); 