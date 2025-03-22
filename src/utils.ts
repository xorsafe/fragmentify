import { Block } from './types';

/**
 * Checks if an array is sorted in ascending order and continuous
 */
export function isArraySortedAscendingAndContinuous(array: number[]): boolean {
    for (let i = 1; i < array.length; i++) {
        if (array[i] !== array[i - 1] + 1) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if blocks are contiguous
 */
export function areBlocksContiguous(blocks: Block[]): boolean {
    if (blocks.length == 0) {
        return true;
    }
    let hop = blocks[0].start;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.start >= block.end) {
            return false;
        } else if (block.start != hop) {
            return false;
        }
        hop = block.end;
    }
    return true;
}

/**
 * Generates an uneven distribution of numbers that sum to the total
 */
export function variableUnevenDistribution(total: number, splits: number): number[] {
    if (splits <= 0) return [];
    if (splits === 1) return [total];

    const result: number[] = [];
    let remaining = total;
    
    for (let i = 0; i < splits - 1; i++) {
        // Ensure we leave enough for remaining splits
        const maxAllowed = remaining - (splits - i - 1); // Leave at least 1 for each remaining split
        const max = Math.min(Math.floor(remaining * 0.8), maxAllowed);
        const min = Math.max(1, Math.floor(remaining * 0.2));
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        result.push(value);
        remaining -= value;
    }
    
    // Add the remaining amount as the last split
    result.push(remaining);
    
    return result;
} 