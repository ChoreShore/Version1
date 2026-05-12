import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGeolocation } from '~/composables/useGeolocation';

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset navigator.geolocation
    Object.defineProperty(global, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: vi.fn()
        }
      },
      writable: true
    });
  });

  it('should detect geolocation support', () => {
    const geo = useGeolocation();
    expect(geo.isSupported.value).toBe(true);
  });

  it('should detect no geolocation support', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true
    });

    const geo = useGeolocation();
    expect(geo.isSupported.value).toBe(false);
  });

  it('should get current position successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10
      }
    };

    (navigator.geolocation.getCurrentPosition as any) = vi.fn((success) => {
      success(mockPosition);
    });

    const geo = useGeolocation();
    await geo.getCurrentPosition();

    expect(geo.state.value.latitude).toBe(51.5074);
    expect(geo.state.value.longitude).toBe(-0.1278);
    expect(geo.state.value.accuracy).toBe(10);
    expect(geo.state.value.loading).toBe(false);
    expect(geo.state.value.error).toBeNull();
    expect(geo.hasLocation.value).toBe(true);
  });

  it('should handle permission denied', async () => {
    const mockError = {
      code: 1,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };

    (navigator.geolocation.getCurrentPosition as any) = vi.fn((_, error) => {
      error(mockError);
    });

    const geo = useGeolocation();
    await geo.getCurrentPosition();

    expect(geo.state.value.error).toContain('denied');
    expect(geo.state.value.permissionDenied).toBe(true);
    expect(geo.state.value.loading).toBe(false);
  });

  it('should handle position unavailable', async () => {
    const mockError = {
      code: 2,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };

    (navigator.geolocation.getCurrentPosition as any) = vi.fn((_, error) => {
      error(mockError);
    });

    const geo = useGeolocation();
    await geo.getCurrentPosition();

    expect(geo.state.value.error).toContain('unavailable');
    expect(geo.state.value.loading).toBe(false);
  });

  it('should handle timeout', async () => {
    const mockError = {
      code: 3,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };

    (navigator.geolocation.getCurrentPosition as any) = vi.fn((_, error) => {
      error(mockError);
    });

    const geo = useGeolocation();
    await geo.getCurrentPosition();

    expect(geo.state.value.error).toContain('timed out');
    expect(geo.state.value.loading).toBe(false);
  });

  it('should clear location', async () => {
    const mockPosition = {
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10
      }
    };

    (navigator.geolocation.getCurrentPosition as any) = vi.fn((success) => {
      success(mockPosition);
    });

    const geo = useGeolocation();
    await geo.getCurrentPosition();
    expect(geo.hasLocation.value).toBe(true);

    geo.clearLocation();
    expect(geo.hasLocation.value).toBe(false);
    expect(geo.state.value.latitude).toBeNull();
    expect(geo.state.value.longitude).toBeNull();
  });
});
