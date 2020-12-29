import { Component, OnInit } from '@angular/core';
import { IonInfiniteScroll, IonRefresher } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chunk, sortBy } from 'lodash-es';
import { combineLatest, defer } from 'rxjs';
import { concatMap, first, map, single, skipWhile, tap } from 'rxjs/operators';
import { CameraService } from '../../../shared/services/camera/camera.service';
import { CollectorService } from '../../../shared/services/collector/collector.service';
import {
  DiaBackendAsset,
  DiaBackendAssetRepository,
} from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { DiaBackendTransactionRepository } from '../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { getOldProof } from '../../../shared/services/repositories/proof/old-proof-adapter';
import { Proof } from '../../../shared/services/repositories/proof/proof';
import { ProofRepository } from '../../../shared/services/repositories/proof/proof-repository.service';
import {
  InfiniteScrollEvent,
  PagingSource,
} from '../../../utils/paging-source/paging-source';
import { CaptureItem } from './capture-item/capture-item.component';

const CAPTURE_ITEM_HEIGHT_PX = 110;
const POST_CAPTURE_ITEM_HEIGHT_PX = 600;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage implements OnInit {
  private readonly captureRemoteSource = new PagingSource(options =>
    this.diaBackendAssetRepository.fetchAll$(options).pipe(first())
  );
  readonly chunkedCaptures$ = combineLatest([
    this.captureRemoteSource.data$.pipe(
      map(diaBackendAssets => diaBackendAssets.filter(a => a.is_original_owner))
    ),
    this.proofRepository.getAll$(),
  ]).pipe(
    skipWhile(([diaBackendAssets]) => diaBackendAssets.length === 0),
    map(([diaBackendAssets, proofs]) =>
      mergeDiaBackendAssetsAndProofs(diaBackendAssets, proofs)
    ),
    map(captures => sortBy(captures, [c => -c.timestamp])),
    map(captures => chunk(captures, this.capturesPerRow))
  );
  readonly capturesPerRow = 3;
  readonly captureItemHeight = CAPTURE_ITEM_HEIGHT_PX;

  private readonly postCaptureRemoteSource = new PagingSource(
    options => this.diaBackendTransactionRepository.fetchAllReceived$(options),
    10
  );
  readonly postCaptures$ = this.postCaptureRemoteSource.data$.pipe(
    map(transactions =>
      transactions.filter(
        transaction => !transaction.expired && transaction.fulfilled_at
      )
    )
  );
  readonly postCaptureItemHeight = POST_CAPTURE_ITEM_HEIGHT_PX;

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly cameraService: CameraService,
    private readonly collectorService: CollectorService,
    private readonly proofRepository: ProofRepository,
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository
  ) {}

  ngOnInit() {
    this.refreshCapture();
    this.refreshPostCapture();
  }

  refreshCapture(
    event?: RefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    this.captureRemoteSource
      .refresh$()
      .pipe(
        tap(() => {
          if (ionInfiniteScroll) ionInfiniteScroll.disabled = false;
          event?.target.complete();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  refreshPostCapture(
    event?: RefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    this.postCaptureRemoteSource
      .refresh$()
      .pipe(
        tap(() => {
          if (ionInfiniteScroll) ionInfiniteScroll.disabled = false;
          event?.target.complete();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  trackById(_: number, item: DiaBackendAsset) {
    return item.id;
  }

  captureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const columnPaddingPx = 10;
    return CAPTURE_ITEM_HEIGHT_PX + columnPaddingPx;
  }

  postCaptureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const imageMarginPx = 16;
    return POST_CAPTURE_ITEM_HEIGHT_PX + imageMarginPx;
  }

  loadCaptures(event: InfiniteScrollEvent) {
    return this.captureRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadPostCaptures(event: InfiniteScrollEvent) {
    return this.postCaptureRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  capture() {
    return defer(() => this.cameraService.capture())
      .pipe(
        concatMap(photo =>
          this.collectorService.runAndStore({
            [photo.base64]: { mimeType: photo.mimeType },
          })
        ),
        concatMap(proof => this.diaBackendAssetRepository.add$(proof)),
        single(),
        tap(() => this.refreshCapture()),
        untilDestroyed(this)
      )
      .subscribe();
  }
}

function mergeDiaBackendAssetsAndProofs(
  diaBackendAssets: DiaBackendAsset[],
  proofs: Proof[]
) {
  let unpublishedProofs = proofs;
  const items: CaptureItem[] = [];

  for (const diaBackendAsset of diaBackendAssets) {
    const found = proofs.find(
      proof => getOldProof(proof).hash === diaBackendAsset.proof_hash
    );
    unpublishedProofs = unpublishedProofs.filter(proof => proof !== found);
    items.push(new CaptureItem({ diaBackendAsset, proof: found }));
  }

  for (const unpublished of unpublishedProofs) {
    items.push(new CaptureItem({ proof: unpublished }));
  }

  return items;
}

interface RefresherEvent extends CustomEvent {
  readonly target: EventTarget & IonRefresher;
}
