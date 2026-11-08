import * as Device from "expo-device";
import { Platform } from "react-native";

// Identyfikator urządzenia używany przez serwer do mapowania push tokenu na telefon.
// Device.modelName + osBuildId daje stabilny fingerprint.
export const getDeviceId = () => {
  return `${Device.modelName || "unknown"}_${Device.osInternalBuildId || Device.osBuildId || "unknown"}_${Platform.OS}`;
};
