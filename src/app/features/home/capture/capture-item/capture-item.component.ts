import {
  Component,
  HostListener,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, defer, EMPTY } from 'rxjs';
import {
  concatMapTo,
  distinctUntilChanged,
  finalize,
  first,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  DiaBackendAsset,
  DiaBackendAssetRepository,
} from '../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { getOldProof } from '../../../../shared/services/repositories/proof/old-proof-adapter';
import {
  Documents,
  Proof,
} from '../../../../shared/services/repositories/proof/proof';
import { isNonNullable } from '../../../../utils/rx-operators/rx-operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture-item',
  templateUrl: './capture-item.component.html',
  styleUrls: ['./capture-item.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class CaptureItemComponent implements OnInit {
  @Input()
  set item(value: CaptureItem) {
    this._item$.next(value);
  }
  @Input()
  set autoUpload(value: boolean) {
    this._autoUpload$.next(value);
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
  private readonly _autoUpload$ = new BehaviorSubject(false);
  readonly autoUpload$ = this._autoUpload$
    .asObservable()
    .pipe(distinctUntilChanged());
  isUploading = false;
  hasUploaded = false;

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository
  ) {}

  ngOnInit() {
    combineLatest([
      this.item$,
      this.autoUpload$,
      defer(async () => this.isUploading),
    ])
      .pipe(
        switchMap(([item, autoUpload, isUploading]) => {
          if (autoUpload && item.proof && !item.diaBackendAsset && !isUploading)
            return this.upload$(item.proof);
          return EMPTY;
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private upload$(proof: Proof) {
    return defer(async () => (this.isUploading = true)).pipe(
      concatMapTo(this.diaBackendAssetRepository.add$(proof)),
      first(),
      tap(() => (this.hasUploaded = true)),
      finalize(() => (this.isUploading = false))
    );
  }

  @HostListener('click')
  click() {
    this.item$
      .pipe(
        first(),
        switchMap(item => {
          if (!this.isUploading && item.proof && !item.diaBackendAsset)
            return this.upload$(item.proof);
          return EMPTY;
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }
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
    if (this.diaBackendAsset?.information.proof)
      return this.diaBackendAsset.information.proof.timestamp;
    if (this.proof) return this.proof.timestamp;
    return this.createdTimestamp;
  }

  async getThumbnailUrl() {
    if (this.diaBackendAsset) return this.diaBackendAsset.asset_file_thumbnail;
    if (this.proof) return this.proof.getThumbnailUrl();
  }
}
