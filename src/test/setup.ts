import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
}

// Provide minimal 2D canvas context stub for ECharts in JSDOM
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    const base: Record<string, unknown> = {
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      createImageData: vi.fn(() => []),
      measureText: vi.fn(() => ({ width: 0 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      getLineDash: vi.fn(() => []),
      canvas: { width: 800, height: 440 },
    };
    return new Proxy(base, {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        const fn = vi.fn();
        target[prop] = fn;
        return fn;
      },
      set(target, prop: string, value) {
        target[prop] = value;
        return true;
      },
    });
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
