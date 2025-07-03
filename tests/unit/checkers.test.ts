import { describe, it, expect } from 'vitest';
import { isJavaScriptLikeModule } from '../../src/utils/checkers';

describe('isJavaScriptLikeModule', () => {
  it('should return true for JavaScript-like file extensions', () => {
    expect(isJavaScriptLikeModule('test.js')).toBe(true);
    expect(isJavaScriptLikeModule('test.jsx')).toBe(true);
    expect(isJavaScriptLikeModule('test.ts')).toBe(true);
    expect(isJavaScriptLikeModule('test.tsx')).toBe(true);
    expect(isJavaScriptLikeModule('test.mjs')).toBe(true);
    expect(isJavaScriptLikeModule('test.cjs')).toBe(true);
  });

  it('should return false for non-JavaScript-like file extensions', () => {
    expect(isJavaScriptLikeModule('test.css')).toBe(false);
    expect(isJavaScriptLikeModule('test.html')).toBe(false);
    expect(isJavaScriptLikeModule('test.json')).toBe(false);
  });

  it('should handle query parameters and hashes', () => {
    expect(isJavaScriptLikeModule('test.js?v=123')).toBe(true);
    expect(isJavaScriptLikeModule('test.ts#hash')).toBe(true);
    expect(isJavaScriptLikeModule('test.css?v=123')).toBe(false);
  });
});
