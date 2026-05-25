import '@testing-library/jest-dom';
import { vi } from 'vitest';

const glStub = () =>
  new Proxy(
    { canvas: { width: 800, height: 600 }, getParameter: () => [], getExtension: () => null,
      getShaderPrecisionFormat: () => ({ precision: 1, rangeMin: 1, rangeMax: 1 }) },
    { get: (target, prop) => (prop in target ? (target as any)[prop] : vi.fn()) },
  );

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn((type: string) =>
    type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl' ? glStub() : null,
  ),
});

global.ResizeObserver = vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }));
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as any);
