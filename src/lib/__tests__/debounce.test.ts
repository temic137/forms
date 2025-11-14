import { debounce, throttle } from '../debounce';

describe('debounce', () => {
  jest.useFakeTimers();

  test('delays function execution', () => {
    const func = jest.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  test('cancels previous calls', () => {
    const func = jest.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  test('passes arguments correctly', () => {
    const func = jest.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc('test', 123);
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledWith('test', 123);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});

describe('throttle', () => {
  jest.useFakeTimers();

  test('limits function calls', () => {
    const func = jest.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    throttledFunc();
    throttledFunc();

    expect(func).toHaveBeenCalledTimes(1);
  });

  test('allows calls after time limit', () => {
    const func = jest.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFunc();
    expect(func).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
