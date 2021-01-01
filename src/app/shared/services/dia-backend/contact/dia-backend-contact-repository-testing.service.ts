import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendContactTestingRepository {
  fetchAll$(_options: PagingFetchFunctionOptions) {
    return of([]);
  }
}
