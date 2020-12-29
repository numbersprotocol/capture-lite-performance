import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { DiaBackendAssetRepository } from './dia-backend-asset-repository.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAssetTestingRepository extends DiaBackendAssetRepository {
  fetchAll$(_options: PagingFetchFunctionOptions) {
    return of([]);
  }
}
