import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer } from 'rxjs';
import { concatMap, concatMapTo, pluck, tap } from 'rxjs/operators';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import { DiaBackendAuthService } from '../auth/dia-backend-auth.service';
import { BASE_URL } from '../secret';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendContactRepository {
  private readonly _isFetching$ = new BehaviorSubject(false);
  readonly isFetching$ = this._isFetching$.asObservable();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: DiaBackendAuthService
  ) {}

  fetchAll$(options: PagingFetchFunctionOptions) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListContactResponse>(
          `${BASE_URL}/api/v2/contacts/`,
          {
            headers,
            params: {
              limit: `${options.pagingSize}`,
              offset: `${options.offset}`,
            },
          }
        )
      ),
      pluck('results'),
      tap(() => this._isFetching$.next(false))
    );
  }
}

export interface DiaBackendContact extends Tuple {
  readonly contact_email: string;
  readonly contact_name?: string;
}

interface ListContactResponse {
  readonly results: DiaBackendContact[];
}
