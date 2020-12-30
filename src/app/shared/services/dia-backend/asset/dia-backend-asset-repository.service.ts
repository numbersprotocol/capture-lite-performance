import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, forkJoin, Subject } from 'rxjs';
import { concatMap, concatMapTo, pluck, tap } from 'rxjs/operators';
import { base64ToBlob } from '../../../../utils/encoding/encoding';
import { toExtension } from '../../../../utils/mime-type';
import { PagingFetchFunctionOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import {
  getOldSignatures,
  getSortedProofInformation,
  OldSignature,
  SortedProofInformation,
} from '../../repositories/proof/old-proof-adapter';
import { Proof } from '../../repositories/proof/proof';
import { DiaBackendAuthService } from '../auth/dia-backend-auth.service';
import { BASE_URL } from '../secret';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAssetRepository {
  private readonly _isDirtyEvent$ = new Subject<string | undefined>();
  readonly isDirtyEvent$ = this._isDirtyEvent$.asObservable();
  private readonly _isFetching$ = new BehaviorSubject(false);
  readonly isFetching$ = this._isFetching$.asObservable();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: DiaBackendAuthService
  ) {}

  setIsDirty(cause?: string) {
    this._isDirtyEvent$.next(cause);
  }

  fetchAllOriginallyOwned$(
    options: PagingFetchFunctionOptions = { pagingSize: 100, offset: 0 }
  ) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ListAssetResponse>(`${BASE_URL}/api/v2/assets/`, {
          headers,
          params: {
            limit: `${options.pagingSize}`,
            offset: `${options.offset}`,
            is_original_owner: `${true}`,
          },
        })
      ),
      pluck('results'),
      tap(() => this._isFetching$.next(false))
    );
  }

  fetchById$(id: string) {
    return defer(async () => this._isFetching$.next(true)).pipe(
      concatMapTo(defer(() => this.authService.getAuthHeaders())),
      concatMap(headers =>
        this.httpClient.get<ReadAssetResponse>(
          `${BASE_URL}/api/v2/assets/${id}/`,
          { headers }
        )
      )
    );
  }

  add$(proof: Proof) {
    return forkJoin([
      defer(() => this.authService.getAuthHeaders()),
      defer(() => buildFormDataToCreateAsset(proof)),
    ]).pipe(
      concatMap(([headers, formData]) =>
        this.httpClient.post<CreateAssetResponse>(
          `${BASE_URL}/api/v2/assets/`,
          formData,
          { headers }
        )
      ),
      tap(() => this.setIsDirty('add'))
    );
  }

  removeById$(id: string) {
    return defer(() => this.authService.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.delete<DeleteAssetResponse>(
          `${BASE_URL}/api/v2/assets/${id}/`,
          { headers }
        )
      ),
      tap(() => this.setIsDirty('remove'))
    );
  }
}

export interface DiaBackendAsset extends Tuple {
  readonly id: string;
  readonly proof_hash: string;
  readonly asset_file: string;
  readonly asset_file_thumbnail: string;
  readonly sharable_copy: string;
  readonly information: SortedProofInformation;
  readonly signature: OldSignature[];
  readonly owner: string;
  readonly is_original_owner: boolean;
}

interface ListAssetResponse {
  results: DiaBackendAsset[];
}

type ReadAssetResponse = DiaBackendAsset;

type CreateAssetResponse = DiaBackendAsset;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DeleteAssetResponse {}

async function buildFormDataToCreateAsset(proof: Proof) {
  const formData = new FormData();

  const info = await getSortedProofInformation(proof);
  formData.set('meta', JSON.stringify(info));

  formData.set('signature', JSON.stringify(getOldSignatures(proof)));

  const fileBase64 = Object.keys(await proof.getAssets())[0];
  const mimeType = Object.values(proof.indexedAssets)[0].mimeType;
  formData.set(
    'asset_file',
    await base64ToBlob(fileBase64, mimeType),
    `proof.${toExtension(mimeType)}`
  );

  formData.set('asset_file_mime_type', mimeType);

  return formData;
}
