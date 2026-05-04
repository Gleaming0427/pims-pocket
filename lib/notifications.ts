import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { db } from './firebase';
import { shouldRunExpoPushRegistration } from './pushDeviceSupport';

const EXPO_PUSH_API_BASE = 'https://exp.host/--/api/v2/';
const EXPO_GET_PUSH_TOKEN_URL = `${EXPO_PUSH_API_BASE}push/getExpoPushToken`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  const projectId = getExpoProjectId();
  if (!projectId) {
    return null;
  }

  if (!shouldRunExpoPushRegistration()) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PocketKids',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
      baseUrl: EXPO_PUSH_API_BASE,
      url: EXPO_GET_PUSH_TOKEN_URL,
    });
    const token = tokenData.data;
    await db.collection('users').doc(userId).update({ fcmToken: token });
    return token;
  } catch {
    return null;
  }
}

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
