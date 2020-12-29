import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DiaBackendAsset } from '../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import {
  Assets,
  Proof,
} from '../../../../shared/services/repositories/proof/proof';
import { isNonNullable } from '../../../../utils/rx-operators/rx-operators';
import { toDataUrl } from '../../../../utils/url';

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
  readonly cacheKey$ = this.item$.pipe(map(item => item.id));
}

// Uniform interface for Proof, Asset and DiaBackendAsset
export class CaptureItem {
  assets?: Assets;
  proof?: Proof;
  diaBackendAsset?: DiaBackendAsset;

  get id() {
    return this.diaBackendAsset?.id;
  }

  private readonly createdTimestamp: number;

  constructor({
    assets,
    proof,
    diaBackendAsset,
  }: {
    assets?: Assets;
    proof?: Proof;
    diaBackendAsset?: DiaBackendAsset;
  }) {
    this.assets = assets;
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
    if (this.assets) {
      const [base64, meta] = Object.entries(this.assets)[0];
      return toDataUrl(base64, meta.mimeType);
    }
  }
}
