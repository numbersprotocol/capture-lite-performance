import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, forkJoin } from 'rxjs';
import { concatMap, concatMapTo, pluck, tap } from 'rxjs/operators';
import { base64ToBlob } from '../../../../utils/encoding/encoding';
import { toExtension } from '../../../../utils/mime-type';
import { GetAllOptions } from '../../../../utils/paging-source/paging-source';
import { Tuple } from '../../database/table/table';
import {
  getOldSignatures,
  getSortedProofInformation,
  SortedProofInformation,
} from '../../repositories/proof/old-proof-adapter';
import { Proof } from '../../repositories/proof/proof';
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
      )
    );
  }
}

export interface DiaBackendAsset extends Tuple {
  readonly id: string;
  readonly proof_hash: string;
  readonly is_original_owner: boolean;
  readonly asset_file: string;
  readonly asset_file_thumbnail: string;
  readonly sharable_copy: string;
  readonly information: SortedProofInformation;
}

interface ListAssetResponse {
  results: DiaBackendAsset[];
}

type CreateAssetResponse = DiaBackendAsset;

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
