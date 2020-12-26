import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { GetAllOptions } from '../../../../utils/paging-source/paging-source';
import { DiaBackendAssetRepository } from './dia-backend-asset-repository.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAssetTestingRepository extends DiaBackendAssetRepository {
  getAll$(_options: GetAllOptions) {
    return of([]);
  }
}
