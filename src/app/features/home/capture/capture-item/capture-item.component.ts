import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DiaBackendAsset } from '../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { getOldProof } from '../../../../shared/services/repositories/proof/old-proof-adapter';
import {
  Documents,
  Proof,
} from '../../../../shared/services/repositories/proof/proof';
import { isNonNullable } from '../../../../utils/rx-operators/rx-operators';

@Component({
  selector: 'app-capture-item',
  templateUrl: './capture-item.component.html',
  styleUrls: ['./capture-item.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class CaptureItemComponent {
  @Input()
  set item(value: CaptureItem) {
    this._item$.next(value);
  }

  private readonly _item$ = new BehaviorSubject<CaptureItem | undefined>(
    undefined
  );
  readonly item$ = this._item$.asObservable().pipe(isNonNullable());
  readonly thumbnailUrl$ = this.item$.pipe(
    switchMap(item => item.getThumbnailUrl())
  );
  readonly cacheKey$ = this.item$.pipe(
    map(item => {
      if (item.id) return `${item.id}_assetFileThumbnail`;
      if (item.oldProofHash) return `${item.oldProofHash}_proofThumbnail`;
      return undefined;
    })
  );
}

// Uniform interface for Proof, Asset and DiaBackendAsset
export class CaptureItem {
  proof?: Proof;
  diaBackendAsset?: DiaBackendAsset;

  get id() {
    return this.diaBackendAsset?.id;
  }

  get oldProofHash() {
    if (this.diaBackendAsset) return this.diaBackendAsset.proof_hash;
    if (this.proof) return getOldProof(this.proof).hash;
  }

  private readonly createdTimestamp: number;

  constructor({
    proof,
    diaBackendAsset,
  }: {
    documents?: Documents;
    proof?: Proof;
    diaBackendAsset?: DiaBackendAsset;
  }) {
    this.proof = proof;
    this.diaBackendAsset = diaBackendAsset;
    this.createdTimestamp = Date.now();
  }

  get timestamp() {
    if (this.diaBackendAsset)
      return this.diaBackendAsset.information.proof.timestamp;
    if (this.proof) return this.proof.timestamp;
    return this.createdTimestamp;
  }

  async getThumbnailUrl() {
    if (this.diaBackendAsset) return this.diaBackendAsset.asset_file_thumbnail;
    if (this.proof) return this.proof.getThumbnailUrl();
  }
}
