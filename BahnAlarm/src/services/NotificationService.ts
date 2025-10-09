import PushNotificationIOS from '@react-native-community/push-notification-ios';

class NotificationService {
  scheduleNotification(date: Date, message: string) {
    PushNotificationIOS.addNotificationRequest({
      id: 'bahnalarm-notification',
      title: 'BahnAlarm',
      body: message,
      fireDate: date,
    });
  }
}

export const notificationService = new NotificationService();
