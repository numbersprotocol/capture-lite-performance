import {
  AppLaunchUrl,
  AppPlugin,
  AppState,
  PluginListenerHandle,
} from '@capacitor/core';

export class MockAppPlugin implements AppPlugin {
  addListener(): PluginListenerHandle {
    return { remove: () => undefined };
  }

  removeAllListeners(): void {}

  exitApp(): never {
    throw new Error('exited');
  }

  async canOpenUrl(options: { url: string }): Promise<{ value: boolean }> {
    return Promise.resolve({ value: true });
  }

  async getLaunchUrl(): Promise<AppLaunchUrl> {
    return Promise.resolve({ url: '' });
  }

  async getState(_options?: any): Promise<AppState> {
    return {
      isActive: true,
    };
  }

  async openUrl(options: { url: string }): Promise<{ completed: boolean }> {
    return Promise.resolve({ completed: true });
  }
}
