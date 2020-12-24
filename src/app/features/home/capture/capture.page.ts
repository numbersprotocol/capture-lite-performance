import { Component } from '@angular/core';
import { chunk } from 'lodash-es';
import { map } from 'rxjs/operators';
import { DiaBackendAssetRepository } from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';

@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage {
  readonly isFetching$ = this.diaBackendAssetRepository.isFetching$();
  readonly itemsPerRow = 3;
  readonly assets$ = this.diaBackendAssetRepository.getAll$();
  readonly chunkedAssets$ = this.assets$.pipe(
    map(assets => chunk(assets, this.itemsPerRow))
  );

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository
  ) {}
}
