import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { defer } from 'rxjs';
import { concatMapTo } from 'rxjs/operators';
import { BlockingAction } from '../../../shared/services/blocking-action/blocking-action.service';
import { WebCryptoApiSignatureProvider } from '../../../shared/services/collector/signature/web-crypto-api-signature-provider/web-crypto-api-signature-provider.service';
import { Database } from '../../../shared/services/database/database.service';
import { DiaBackendAuthService } from '../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import { CacheStore } from '../../../shared/services/file-store/cache/cache';
import { ImageStore } from '../../../shared/services/file-store/image/image-store';
import { PreferenceManager } from '../../../shared/services/preference-manager/preference-manager.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly username$ = this.diaBackendAuthService.username$;
  readonly email$ = this.diaBackendAuthService.email$;
  readonly publicKey$ = this.webCryptoApiSignatureProvider.publicKey$;
  readonly privateKey$ = this.webCryptoApiSignatureProvider.privateKey$;

  constructor(
    private readonly diaBackendAuthService: DiaBackendAuthService,
    private readonly blockingAction: BlockingAction,
    private readonly webCryptoApiSignatureProvider: WebCryptoApiSignatureProvider,
    private readonly imageStore: ImageStore,
    private readonly cacheStore: CacheStore,
    private readonly database: Database,
    private readonly preferenceManager: PreferenceManager
  ) {}

  logout() {
    const action$ = this.diaBackendAuthService
      .logout$()
      .pipe(
        concatMapTo(defer(() => this.imageStore.clear())),
        concatMapTo(defer(() => this.cacheStore.clear())),
        concatMapTo(defer(() => this.database.clear())),
        concatMapTo(defer(() => this.preferenceManager.clear())),
        concatMapTo(defer(() => reloadApp()))
      );

    this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
  }
}

// Reload the app to force app to re-run the initialization in AppModule.
function reloadApp() {
  location.href = 'index.html';
}
