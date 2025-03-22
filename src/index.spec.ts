import { add } from './index';

describe('add function', () => {
  it('should add two positive numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(10, 20)).toBe(30);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
    expect(add(-10, 20)).toBe(10);
  });

  it('should handle zero', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(0, 0)).toBe(0);
  });
}); 