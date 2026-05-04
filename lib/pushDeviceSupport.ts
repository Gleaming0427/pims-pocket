import { requireOptionalNativeModule } from 'expo-modules-core';

type ExpoDeviceNative = { isDevice: boolean };

function getExpoDevice(): ExpoDeviceNative | null {
  return requireOptionalNativeModule<ExpoDeviceNative>('ExpoDevice');
}

export function shouldRunExpoPushRegistration(): boolean {
  if (process.env.EXPO_PUBLIC_SKIP_EXPO_PUSH_REGISTRATION === '1') {
    return false;
  }
  const mod = getExpoDevice();
  if (mod == null) {
    if (__DEV__ && process.env.EXPO_PUBLIC_ENABLE_PUSH_IN_DEV !== '1') {
      return false;
    }
    return true;
  }
  return mod.isDevice;
}
