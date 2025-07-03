import { describe, it, expect, vi } from 'vitest';
import { debounce } from '../../src/utils/debounce';

describe('debounce', () => {
  it('should debounce a function call', async () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    expect(func).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(func).toHaveBeenCalledOnce();
  });

  it('should pass arguments to the debounced function', async () => {
    const func = vi.fn((x: number) => x * 2);
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(5);
    debouncedFunc(10);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(func).toHaveBeenCalledWith(10);
  });

  it('should execute immediately if leading is true', async () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100, true);

    debouncedFunc();
    expect(func).toHaveBeenCalledOnce();

    debouncedFunc();
    expect(func).toHaveBeenCalledOnce(); // Should not call again immediately

    await new Promise(resolve => setTimeout(resolve, 150));
    debouncedFunc();
    expect(func).toHaveBeenCalledTimes(2); // Should call again after debounce time
  });

  it('should reset timer on subsequent calls', async () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    await new Promise(resolve => setTimeout(resolve, 50));
    debouncedFunc();
    await new Promise(resolve => setTimeout(resolve, 50));
    debouncedFunc();

    expect(func).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(func).toHaveBeenCalledOnce();
  });
});
