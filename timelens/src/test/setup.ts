import '@testing-library/jest-dom';
import { MotionGlobalConfig } from 'motion/react';

MotionGlobalConfig.skipAnimations = true;

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof URL !== 'undefined') {
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:http://localhost:3000/mock-image-blob';
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {};
  }
}

// Mock window.matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
