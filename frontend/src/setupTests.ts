import '@testing-library/jest-dom';
import { vi } from 'vitest';

class MockImage {
  onload?: () => void;
  onerror?: () => void;

  set src(_value: string) {
    if (this.onload) {
      this.onload();
    }
  }
}

// Ensure image preload resolves immediately in tests.
(globalThis as any).Image = MockImage;

// Ant Design and other UI libs rely on these browser APIs.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = MockResizeObserver;

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;

// JSDOM doesn't support pseudo-element computed styles; ignore the pseudo arg.
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element: Element, _pseudoElt?: string | null) =>
  originalGetComputedStyle(element);

vi.setConfig({ testTimeout: 15000 });
