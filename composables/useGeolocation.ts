import { ref, computed } from 'vue';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const defaultState: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  loading: false,
  error: null,
  permissionDenied: false
};

export const useGeolocation = () => {
  const state = ref<GeolocationState>({ ...defaultState });

  const isSupported = computed(() => {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  });

  const hasLocation = computed(() => {
    return state.value.latitude !== null && state.value.longitude !== null;
  });

  const getCurrentPosition = async (options?: PositionOptions): Promise<void> => {
    if (!isSupported.value) {
      state.value.error = 'Geolocation is not supported by your browser';
      return;
    }

    state.value.loading = true;
    state.value.error = null;
    state.value.permissionDenied = false;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.value.latitude = position.coords.latitude;
          state.value.longitude = position.coords.longitude;
          state.value.accuracy = position.coords.accuracy;
          state.value.loading = false;
          resolve();
        },
        (error) => {
          state.value.loading = false;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              state.value.error = 'Location permission denied. Please enable location access in your browser settings.';
              state.value.permissionDenied = true;
              break;
            case error.POSITION_UNAVAILABLE:
              state.value.error = 'Location information is unavailable. Please try again later.';
              break;
            case error.TIMEOUT:
              state.value.error = 'Location request timed out. Please try again.';
              break;
            default:
              state.value.error = 'An unknown error occurred while retrieving your location.';
          }
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          ...options
        }
      );
    });
  };

  const clearLocation = () => {
    state.value = { ...defaultState };
  };

  return {
    ...state.value,
    state,
    isSupported,
    hasLocation,
    getCurrentPosition,
    clearLocation
  };
};
