import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { defer, zip } from 'rxjs';
import {
  concatMap,
  concatMapTo,
  first,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import { BlockingAction } from '../../../../shared/services/blocking-action/blocking-action.service';
import { ConfirmAlert } from '../../../../shared/services/confirm-alert/confirm-alert.service';
import { DiaBackendAssetRepository } from '../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import {
  getOldProof,
  OldDefaultInformationName,
} from '../../../../shared/services/repositories/proof/old-proof-adapter';
import { ProofRepository } from '../../../../shared/services/repositories/proof/proof-repository.service';
import { isNonNullable } from '../../../../utils/rx-operators/rx-operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-asset',
  templateUrl: './asset.page.html',
  styleUrls: ['./asset.page.scss'],
})
export class AssetPage {
  readonly asset$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    isNonNullable(),
    switchMap(id => this.diaBackendAssetRepository.fetchById$(id)),
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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly actionSheetController: ActionSheetController,
    private readonly proofRepository: ProofRepository,
    private readonly router: Router,
    private readonly confirmAlert: ConfirmAlert,
    private readonly blockingAction: BlockingAction,
    private readonly translocoService: TranslocoService
  ) {}

  async showOptionsMenu() {
    const actionSheet = await this.actionSheetController.create({
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => this.remove(),
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close',
        },
      ],
    });
    return actionSheet.present();
  }

  async remove() {
    const action$ = zip(this.asset$, this.proofRepository.getAll$()).pipe(
      first(),
      concatMap(async ([diaBackendAsset, proofs]) => {
        const found = proofs.find(
          proof => getOldProof(proof).hash === diaBackendAsset.proof_hash
        );
        if (found) await this.proofRepository.remove(found);
        return diaBackendAsset;
      }),
      concatMap(diaBackendAsset =>
        this.diaBackendAssetRepository
          .removeById$(diaBackendAsset.id)
          .pipe(first())
      ),
      concatMapTo(defer(() => this.router.navigate(['..'])))
    );

    const result = await this.confirmAlert.present();
    if (result) {
      this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
    }
  }
}
