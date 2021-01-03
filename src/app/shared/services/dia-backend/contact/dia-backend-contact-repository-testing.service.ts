import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { PagingFetchFunctionOptions } from '../../paging-source-manager/paging-source/paging-source';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendContactTestingRepository {
  fetchAll$(_options: PagingFetchFunctionOptions) {
    return of([]);
  }
}
