import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { logHttp } from "./debugLogger";

// Status codes contract with the server:
// 400 - invalid data (wrong password, unknown account, invalid OAuth token)
// 401 - session is missing or expired -> log the user out
// 403 - session is valid, but the user has no permission for this action
let onSessionExpired = null;

// AuthContext registers the handler, because it owns the session state.
export const setOnSessionExpired = (handler) => {
  onSessionExpired = handler;
};

// Pobierz URL serwera z konfiguracji Expo
const getBaseURL = () => {
  const isDev = process.env.EXPO_MODE === "development" || __DEV__;

  if (isDev) {
    // W development:
    // - Android emulator: 10.0.2.2 to alias dla localhost hosta
    // - iOS simulator: localhost działa
    // - Fizyczne urządzenie: użyj IP komputera z .env
    const devServerUrl =
      process.env.EXPO_PUBLIC_SERVER_URL ||
      (Platform.OS === "android"
        ? "http://10.0.2.2:3000/api/v1"
        : "http://localhost:3000/api/v1");

    return devServerUrl;
  }

  // W produkcji - użyj URL z konfiguracji
  const serverUrl =
    Constants.expoConfig?.extra?.serverUrl ||
    process.env.EXPO_PUBLIC_SERVER_URL ||
    "https://boiskoplus-backend.onrender.com/api/v1";

  return serverUrl;
};

const baseURL = getBaseURL();
console.log("API Base URL:", baseURL); // Debug - usuń w produkcji

const customFetch = axios.create({
  baseURL,
  timeout: 60000, // 60 sekund dla rejestracji (email może trwać dłużej)
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor dla requestów - dodaj token autoryzacji
customFetch.interceptors.request.use(
  async (config) => {
    try {
      // Pobierz token z SecureStore
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Błąd pobierania tokena:", error);
    }

    // Debug w trybie development
    if (__DEV__) {
      config._startTime = Date.now();
      console.log(
        "Request:",
        config.method?.toUpperCase(),
        (config.baseURL || "") + config.url,
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor dla odpowiedzi — obsługa błędów + HTTP timing
customFetch.interceptors.response.use(
  (response) => {
    if (__DEV__ && response.config?._startTime) {
      const duration = Date.now() - response.config._startTime;
      logHttp(
        response.config.method?.toUpperCase(),
        response.config.url,
        duration,
        response.status,
      );
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("[customFetch] 401 - session expired:", error.config?.url);
      if (onSessionExpired) {
        onSessionExpired();
      }
    }

    if (status === 403) {
      console.warn("[customFetch] 403 - forbidden:", error.config?.url);
    }

    // Obsługa timeout
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    }

    // Obsługa braku połączenia
    if (!error.response) {
      console.error("Network error - brak połączenia z serwerem");
    }

    return Promise.reject(error);
  },
);

// Helper do zapisywania tokena
export const setAuthToken = async (token) => {
  try {
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
    console.error("Błąd zapisywania tokena:", error);
  }
};

// Helper do usuwania tokena
export const removeAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Błąd usuwania tokena:", error);
  }
};

// Helper do sprawdzania czy token istnieje
export const hasAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    // !! zmienia wartość na boolean
    return !!token;
  } catch (error) {
    console.error("Błąd sprawdzania tokena:", error);
    return false;
  }
};

export default customFetch;
