import {
  LocalNotification,
  LocalNotificationActionPerformed,
  LocalNotificationActionType,
  LocalNotificationEnabledResult,
  LocalNotificationPendingList,
  LocalNotificationScheduleResult,
  LocalNotificationsPlugin,
  NotificationChannel,
  NotificationChannelList,
  NotificationPermissionResponse,
  PluginListenerHandle,
} from '@capacitor/core';

export class MockLocalNotificationsPlugin implements LocalNotificationsPlugin {
  async schedule(options: {
    notifications: LocalNotification[];
  }): Promise<LocalNotificationScheduleResult> {
    return {
      notifications: options.notifications.map(notification => ({
        id: `${notification.id}`,
      })),
    };
  }

  async getPending(): Promise<LocalNotificationPendingList> {
    throw new Error('Method not implemented.');
  }

  async registerActionTypes(_options: {
    types: LocalNotificationActionType[];
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async cancel(_pending: LocalNotificationPendingList): Promise<void> {
    return;
  }

  async areEnabled(): Promise<LocalNotificationEnabledResult> {
    throw new Error('Method not implemented.');
  }

  async createChannel(_channel: NotificationChannel): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async deleteChannel(_channel: NotificationChannel): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async listChannels(): Promise<NotificationChannelList> {
    throw new Error('Method not implemented.');
  }

  async requestPermission(): Promise<NotificationPermissionResponse> {
    return { granted: true };
  }

  addListener(
    eventName: 'localNotificationReceived',
    listenerFunc: (notification: LocalNotification) => void
  ): PluginListenerHandle;
  addListener(
    eventName: 'localNotificationActionPerformed',
    listenerFunc: (notificationAction: LocalNotificationActionPerformed) => void
  ): PluginListenerHandle;
  addListener(
    _eventName:
      | 'localNotificationReceived'
      | 'localNotificationActionPerformed',
    _listenerFunc:
      | ((notification: LocalNotification) => void)
      | ((notificationAction: LocalNotificationActionPerformed) => void)
  ): PluginListenerHandle {
    throw new Error('Method not implemented.');
  }

  removeAllListeners(): void {
    throw new Error('Method not implemented.');
  }
}
