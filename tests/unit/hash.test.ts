import { describe, it, expect } from 'vitest';
import { generateMd5Hash, fnv1a64Hash } from '../../src/utils/hash';

describe('generateMd5Hash', () => {
  it('should generate a consistent MD5 hash for a given string', () => {
    const input = 'hello world';
    const expectedHash = '5eb63bbbe01eeed093cb22bb8f5acdc3'; // MD5 hash of 'hello world'
    expect(generateMd5Hash(input)).toBe(expectedHash);
  });

  it('should generate different hashes for different inputs', () => {
    const input1 = 'hello';
    const input2 = 'world';
    expect(generateMd5Hash(input1)).not.toBe(generateMd5Hash(input2));
  });

  it('should handle empty string', () => {
    const input = '';
    const expectedHash = 'd41d8cd98f00b204e9800998ecf8427e'; // MD5 hash of empty string
    expect(generateMd5Hash(input)).toBe(expectedHash);
  });
});

describe('fnv1a64Hash', () => {
  it('should generate a consistent hash for a given object', () => {
    const obj = { a: 1, b: 'hello' };
    const expectedHash = 'dd5a74176157913d';
    expect(fnv1a64Hash(obj)).toBe(expectedHash);
  });

  it('should generate a different hash for a different object', () => {
    const obj1 = { a: 1, b: 'hello' };
    const obj2 = { a: 1, b: 'world' };
    expect(fnv1a64Hash(obj1)).not.toBe(fnv1a64Hash(obj2));
  });

  it('should handle circular references', () => {
    const obj: any = { a: 1 };
    obj.b = obj;
    const expectedHash = 'e25422381734ad20';
    expect(fnv1a64Hash(obj)).toBe(expectedHash);
  });
});
