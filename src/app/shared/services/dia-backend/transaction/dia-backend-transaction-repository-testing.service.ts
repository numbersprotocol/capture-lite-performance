import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { DiaBackendTransactionRepository } from './dia-backend-transaction-repository.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendTransactionTestingRepository extends DiaBackendTransactionRepository {
  fetchAll$(_options: PagingFetchFunctionOptions) {
    return of([]);
  }

  fetchAllReceived$(_options: PagingFetchFunctionOptions) {
    return of([]);
  }
}
