import 'abort-controller/polyfill';
import { UnavailabilityError } from 'expo-modules-core';
import ServerRegistrationModule from 'expo-notifications/build/ServerRegistrationModule';

/**
 * Drop-in replacement for expo-notifications' DevicePushTokenAutoRegistration.fx:
 * keeps setAutoServerRegistrationEnabledAsync (native persistence) but removes the
 * module-load listener + persisted retry that POST to exp.host (simulator "Network request failed" spam).
 */
export async function setAutoServerRegistrationEnabledAsync(enabled) {
  if (!ServerRegistrationModule?.setRegistrationInfoAsync) {
    throw new UnavailabilityError('ServerRegistrationModule', 'setRegistrationInfoAsync');
  }
  await ServerRegistrationModule.setRegistrationInfoAsync(
    enabled ? JSON.stringify({ isEnabled: enabled }) : null
  );
}

export async function __handlePersistedRegistrationInfoAsync() {}
