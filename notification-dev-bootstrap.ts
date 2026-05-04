import * as Notifications from 'expo-notifications';

void Notifications.setAutoServerRegistrationEnabledAsync(false).catch(() => {});
