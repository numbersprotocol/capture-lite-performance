import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, Subject } from 'rxjs';
import { concatMap, concatMapTo, pluck, tap } from 'rxjs/operators';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import { DiaBackendAuthService } from '../auth/dia-backend-auth.service';
import { BASE_URL } from '../secret';
import { IgnoredTransactionRepository } from './ignored-transaction-repository.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendTransactionRepository {
  private readonly _isDirtyEvent$ = new Subject<string | undefined>();
  readonly isDirtyEvent$ = this._isDirtyEvent$.asObservable();
  private readonly _isFetching$ = new BehaviorSubject(false);
  readonly isFetching$ = this._isFetching$.asObservable();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: DiaBackendAuthService,
    private readonly ignoredTransactionRepository: IgnoredTransactionRepository
  ) {}

  setIsDirty(cause?: string) {
    this._isDirtyEvent$.next(cause);
  }

  fetchAll$(
    options: PagingFetchFunctionOptions = { pagingSize: 100, offset: 0 }
  ) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/`,
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

  fetchAllReceived$(
    options: PagingFetchFunctionOptions = { pagingSize: 100, offset: 0 }
  ) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/`,
          {
            headers,
            params: {
              user_is_receiver: `${true}`,
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

  fetchInbox$(
    options: PagingFetchFunctionOptions = { pagingSize: 100, offset: 0 }
  ) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/inbox/`,
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

  add$(assetId: string, targetEmail: string, caption: string) {
    return defer(() => this.authService.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.post<CreateTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/`,
          { asset_id: assetId, email: targetEmail, caption },
          { headers }
        )
      ),
      tap(() => this.setIsDirty('add'))
    );
  }

  accept$(id: string) {
    return defer(() => this.authService.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.post<AcceptTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/${id}/accept/`,
          {},
          { headers }
        )
      ),
      tap(() => this.setIsDirty('accept'))
    );
  }
}

export interface DiaBackendTransaction extends Tuple {
  readonly id: string;
  readonly asset: {
    readonly id: string;
    readonly asset_file_thumbnail: string;
    readonly caption: string;
  };
  readonly sender: string;
  readonly receiver_email: string;
  readonly created_at: string;
  readonly fulfilled_at: string | null;
  readonly expired: boolean;
}

interface ListTransactionResponse {
  readonly results: DiaBackendTransaction[];
}

type CreateTransactionResponse = DiaBackendTransaction;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AcceptTransactionResponse {}
