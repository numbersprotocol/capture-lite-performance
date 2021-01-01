import { Component, Input } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { BehaviorSubject } from 'rxjs';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { isNonNullable } from '../../../utils/rx-operators/rx-operators';
import { DiaBackendAssetRepository } from '../../services/dia-backend/asset/dia-backend-asset-repository.service';
import { DiaBackendTransaction } from '../../services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { OldDefaultInformationName } from '../../services/repositories/proof/old-proof-adapter';

@Component({
  selector: 'app-post-capture',
  templateUrl: './post-capture.component.html',
  styleUrls: ['./post-capture.component.scss'],
})
export class PostCaptureComponent {
  @Input()
  set transaction(value: DiaBackendTransaction) {
    this._transaction$.next(value);
  }

  private readonly _transaction$ = new BehaviorSubject<
    DiaBackendTransaction | undefined
  >(undefined);
  readonly transaction$ = this._transaction$
    .asObservable()
    .pipe(isNonNullable());
  readonly asset$ = this.transaction$.pipe(
    switchMap(transaction =>
      this.diaBackendAssetRepository.fetchById$(transaction.asset.id)
    ),
    first(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly location$ = this.asset$.pipe(
    map(asset => {
      const latitude = asset.information.information.find(
        info => info.name === OldDefaultInformationName.GEOLOCATION_LATITUDE
      )?.value;
      const longitude = asset.information.information.find(
        info => info.name === OldDefaultInformationName.GEOLOCATION_LONGITUDE
      )?.value;
      if (!latitude || !longitude)
        return this.translocoService.translate('locationNotProvided');

      return `${latitude}, ${longitude}`;
    })
  );
  showMore = false;

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly translocoService: TranslocoService
  ) {}
}
