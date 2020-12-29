import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { map, share, switchMap } from 'rxjs/operators';
import { DiaBackendAssetRepository } from '../../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { OldDefaultInformationName } from '../../../../../shared/services/repositories/proof/old-proof-adapter';
import { isNonNullable } from '../../../../../utils/rx-operators/rx-operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-information',
  templateUrl: './information.page.html',
  styleUrls: ['./information.page.scss'],
})
export class InformationPage {
  readonly asset$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    isNonNullable(),
    switchMap(id => this.diaBackendAssetRepository.fetchById$(id)),
    share()
  );

  readonly location$ = this.asset$.pipe(
    map(asset => {
      const latitude = asset.information.information.find(
        info => info.name === OldDefaultInformationName.GEOLOCATION_LATITUDE
      )?.value;
      const longitude = asset.information.information.find(
        info => info.name === OldDefaultInformationName.GEOLOCATION_LONGITUDE
      )?.value;
      if (!latitude || !longitude) return 'Location Not Provided';
      return `${latitude}, ${longitude}`;
    })
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository
  ) {}
}
