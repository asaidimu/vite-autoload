/**
 * Debounces a function, delaying its execution until after a specified `wait` time has passed
 * since the last invocation. Useful for limiting the rate at which a function is called.
 *
 * @template T - The type of the function to debounce.
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to wait after the last call before executing `func`.
 * @param immediate - If true, `func` is executed immediately on the first call, then debounced.
 * @returns A new function that, when invoked, will debounce the execution of `func`.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate: boolean = false,
): (...args: Parameters<T>) => void {
  let timeout: any | null = null;
  let called = false;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
      called = false; // Reset called flag after the debounce period
    };

    const callNow = immediate && !called;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
      called = true;
    }
  };
}
