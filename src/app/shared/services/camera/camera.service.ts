import { Inject, Injectable } from '@angular/core';
import {
  AppPlugin,
  CameraPhoto,
  CameraPlugin,
  CameraResultType,
  CameraSource,
} from '@capacitor/core';
import { Subject } from 'rxjs';
import { fromExtension, MimeType } from '../../../utils/mime-type';
import {
  APP_PLUGIN,
  CAMERA_PLUGIN,
} from '../../core/capacitor-plugins/capacitor-plugins.module';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private readonly killedCapturedPhoto$ = new Subject<Photo>();

  constructor(
    @Inject(APP_PLUGIN)
    private readonly appPlugin: AppPlugin,
    @Inject(CAMERA_PLUGIN)
    private readonly cameraPlugin: CameraPlugin
  ) {
    this.appPlugin.addListener('appRestoredResult', appState => {
      if (
        appState.pluginId === 'Camera' &&
        appState.methodName === 'getPhoto' &&
        appState.success
      ) {
        const cameraPhoto = appState.data as CameraPhoto;
        this.killedCapturedPhoto$.next(cameraPhotoToPhoto(cameraPhoto));
      }
    });
  }

  restoreKilledCapture$() {
    return this.killedCapturedPhoto$.asObservable();
  }

  async capture(): Promise<Photo> {
    const cameraPhoto = await this.cameraPlugin.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 100,
      allowEditing: false,
    });
    return cameraPhotoToPhoto(cameraPhoto);
  }
}

interface Photo {
  readonly mimeType: MimeType;
  readonly base64: string;
}

function cameraPhotoToPhoto(cameraPhoto: CameraPhoto): Photo {
  return {
    mimeType: fromExtension(cameraPhoto.format),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    base64: cameraPhoto.base64String!,
  };
}
