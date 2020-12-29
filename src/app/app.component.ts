import { Component } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concatMap, single } from 'rxjs/operators';
import { CameraService } from './shared/services/camera/camera.service';
import { CollectorService } from './shared/services/collector/collector.service';
import { CapacitorFactsProvider } from './shared/services/collector/facts/capacitor-facts-provider/capacitor-facts-provider.service';
import { WebCryptoApiSignatureProvider } from './shared/services/collector/signature/web-crypto-api-signature-provider/web-crypto-api-signature-provider.service';
import { DiaBackendAssetRepository } from './shared/services/dia-backend/asset/dia-backend-asset-repository.service';

const { SplashScreen } = Plugins;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private readonly platform: Platform,
    private readonly cameraService: CameraService,
    private readonly collectorService: CollectorService,
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly webCryptoApiSignatureProvider: WebCryptoApiSignatureProvider,
    private readonly capacitorFactsProvider: CapacitorFactsProvider
  ) {
    this.initializeApp();
    this.restoreAppStatus();
  }

  async initializeApp() {
    await this.platform.ready();
    await SplashScreen.hide();
  }

  restoreAppStatus() {
    this.cameraService
      .restoreKilledCapture$()
      .pipe(
        concatMap(photo =>
          this.collectorService.runAndStore({
            [photo.base64]: { mimeType: photo.mimeType },
          })
        ),
        concatMap(proof => this.diaBackendAssetRepository.add$(proof)),
        single(),
        untilDestroyed(this)
      )
      .subscribe();
  }

  initializeCollectorService() {
    this.webCryptoApiSignatureProvider.initialize();
    this.collectorService.addFactsProvider(this.capacitorFactsProvider);
    this.collectorService.addSignatureProvider(
      this.webCryptoApiSignatureProvider
    );
  }
}
