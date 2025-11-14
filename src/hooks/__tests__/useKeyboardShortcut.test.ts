/**
 * Tests for useKeyboardShortcut hook
 * Tests Requirement 8.1: Keyboard shortcut (Ctrl+Shift+V) to toggle voice input
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from '../useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call callback when correct key combination is pressed', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    // Simulate Ctrl+Shift+V
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should not call callback when wrong key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    // Simulate Ctrl+Shift+A (wrong key)
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('should not call callback when modifier keys are missing', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    // Simulate just V (no modifiers)
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('should not call callback when disabled', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback, false)
    );

    // Simulate Ctrl+Shift+V
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('should handle case-insensitive key matching', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'V', ctrl: true, shift: true }, callback)
    );

    // Simulate Ctrl+Shift+v (lowercase)
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should prevent default behavior when shortcut is triggered', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('should cleanup event listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    unmount();

    // Simulate Ctrl+Shift+V after unmount
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('should support Meta key (Cmd on Mac) as alternative to Ctrl', () => {
    renderHook(() =>
      useKeyboardShortcut({ key: 'v', ctrl: true, shift: true }, callback)
    );

    // Simulate Cmd+Shift+V (Mac)
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
