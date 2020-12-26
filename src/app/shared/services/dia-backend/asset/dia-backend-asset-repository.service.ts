import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer } from 'rxjs';
import { concatMap, concatMapTo, pluck, tap } from 'rxjs/operators';
import { GetAllOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import { DiaBackendAuthService } from '../auth/dia-backend-auth.service';
import { BASE_URL } from '../secret';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAssetRepository {
  private readonly _isFetching$ = new BehaviorSubject(false);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: DiaBackendAuthService
  ) {}

  getAll$(options: GetAllOptions = { pagingSize: 100, offset: 0 }) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListAssetResponse>(`${BASE_URL}/api/v2/assets/`, {
          headers,
          params: {
            limit: `${options.pagingSize}`,
            offset: `${options.offset}`,
          },
        })
      ),
      pluck('results'),
      tap(() => this._isFetching$.next(false))
    );
  }

  isFetching$() {
    return this._isFetching$.asObservable();
  }
}

export interface DiaBackendAsset extends Tuple {
  readonly id: string;
  readonly proof_hash: string;
  readonly is_original_owner: boolean;
  readonly asset_file: string;
  readonly asset_file_thumbnail: string;
  readonly sharable_copy: string;
}

interface ListAssetResponse {
  results: DiaBackendAsset[];
}
