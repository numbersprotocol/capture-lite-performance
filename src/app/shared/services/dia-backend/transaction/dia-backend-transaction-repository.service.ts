import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, defer } from 'rxjs';
import { concatMap, concatMapTo, map, pluck, tap } from 'rxjs/operators';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import { DiaBackendAuthService } from '../auth/dia-backend-auth.service';
import { BASE_URL } from '../secret';
import { IgnoredTransactionRepository } from './ignored-transaction-repository.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendTransactionRepository {
  private readonly _isFetching$ = new BehaviorSubject(false);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: DiaBackendAuthService,
    private readonly ignoredTransactionRepository: IgnoredTransactionRepository
  ) {}

  isFetching$() {
    return this._isFetching$.asObservable();
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
      concatMapTo(
        defer(() =>
          Promise.all([
            this.authService.getAuthHeaders(),
            this.authService.getEmail(),
          ])
        )
      ),
      concatMap(([headers, email]) =>
        this.httpClient.get<ListTransactionResponse>(
          `${BASE_URL}/api/v2/transactions/`,
          {
            headers,
            params: {
              receiver_email: email,
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
      )
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
      )
    );
  }

  getInbox$() {
    return combineLatest([
      this.fetchAll$(),
      this.ignoredTransactionRepository.getAll$(),
      this.authService.getEmail$(),
    ]).pipe(
      map(([transactions, ignoredTransactions, email]) =>
        transactions.filter(
          transaction =>
            transaction.receiver_email === email &&
            !transaction.fulfilled_at &&
            !transaction.expired &&
            !ignoredTransactions.includes(transaction.id)
        )
      )
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
