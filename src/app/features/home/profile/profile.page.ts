import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { defer } from 'rxjs';
import { concatMapTo } from 'rxjs/operators';
import { BlockingAction } from '../../../shared/services/blocking-action/blocking-action.service';
import { WebCryptoApiSignatureProvider } from '../../../shared/services/collector/signature/web-crypto-api-signature-provider/web-crypto-api-signature-provider.service';
import { DiaBackendAuthService } from '../../../shared/services/dia-backend/auth/dia-backend-auth.service';

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
    private readonly router: Router,
    private readonly webCryptoApiSignatureProvider: WebCryptoApiSignatureProvider
  ) {}

  logout() {
    const action$ = this.diaBackendAuthService
      .logout$()
      .pipe(concatMapTo(defer(() => this.router.navigate(['/login']))));

    this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
  }
}
