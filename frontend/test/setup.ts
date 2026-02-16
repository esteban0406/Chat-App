import '@testing-library/jest-dom';

// Polyfill ResizeObserver for headlessui components in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
