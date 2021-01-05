import { Component, OnInit } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEqual, sortBy, without } from 'lodash-es';
import { BehaviorSubject, combineLatest, defer } from 'rxjs';
import { concatMap, first, map, single, tap } from 'rxjs/operators';
import { CameraService } from '../../../shared/services/camera/camera.service';
import { CollectorService } from '../../../shared/services/collector/collector.service';
import {
  DiaBackendAsset,
  DiaBackendAssetRepository,
} from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import {
  DiaBackendTransaction,
  DiaBackendTransactionRepository,
} from '../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { PagingSourceManager } from '../../../shared/services/paging-source-manager/paging-source-manager.service';
import { getOldProof } from '../../../shared/services/repositories/proof/old-proof-adapter';
import { Proof } from '../../../shared/services/repositories/proof/proof';
import { ProofRepository } from '../../../shared/services/repositories/proof/proof-repository.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
} from '../../../utils/events';
import { CaptureItem } from './capture-item/capture-item.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage implements OnInit {
  readonly isFetching$ = this.diaBackendAssetRepository.isFetching$;
  private readonly captureRemoteSource = this.pagingSourceManager.getPagingSource(
    {
      id: `${DiaBackendAssetRepository.name}_fetchAllOriginallyOwned`,
      pagingFetchFunction$: options =>
        this.diaBackendAssetRepository
          .fetchAllOriginallyOwned$(options)
          .pipe(first()),
      pagingSize: 20,
    }
  );
  private readonly collectingCaptures$ = new BehaviorSubject<CaptureItem[]>([]);
  readonly captures$ = combineLatest([
    this.captureRemoteSource.data$,
    this.proofRepository.getAll$(),
    this.collectingCaptures$.asObservable(),
  ]).pipe(
    map(([diaBackendAssets, proofs, collectingCaptures]) =>
      mergeDiaBackendAssetsAndProofs(diaBackendAssets, proofs).concat(
        collectingCaptures
      )
    ),
    map(captures => sortBy(captures, [c => -c.timestamp]))
  );

  private readonly postCaptureRemoteSource = this.pagingSourceManager.getPagingSource(
    {
      id: `${DiaBackendTransactionRepository.name}_fetchAllReceived`,
      pagingFetchFunction$: options =>
        this.diaBackendTransactionRepository
          .fetchAllReceived$(options)
          .pipe(first()),
      pagingSize: 10,
    }
  );
  readonly postCaptures$ = this.postCaptureRemoteSource.data$.pipe(
    map(transactions =>
      transactions.filter(
        transaction => !transaction.expired && transaction.fulfilled_at
      )
    )
  );

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly cameraService: CameraService,
    private readonly collectorService: CollectorService,
    private readonly proofRepository: ProofRepository,
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly pagingSourceManager: PagingSourceManager
  ) {}

  ngOnInit() {
    this.refreshCaptures();
    this.refreshPostCaptures();

    this.diaBackendAssetRepository.isDirtyEvent$
      .pipe(
        tap(() => this.refreshCaptures()),
        untilDestroyed(this)
      )
      .subscribe();

    this.diaBackendTransactionRepository.isDirtyEvent$
      .pipe(
        tap(() => this.refreshPostCaptures()),
        untilDestroyed(this)
      )
      .subscribe();
  }

  refreshCaptures(
    event?: IonRefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    return this.captureRemoteSource
      .refresh$(event, ionInfiniteScroll)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  refreshPostCaptures(
    event?: IonRefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    return this.postCaptureRemoteSource
      .refresh$(event, ionInfiniteScroll)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackById(_: number, item: DiaBackendAsset | DiaBackendTransaction) {
    return item.id;
  }

  trackCaptureItem(_: number, item: CaptureItem) {
    return item.id ?? item.oldProofHash;
  }

  loadCaptures(event: IonInfiniteScrollEvent) {
    return this.captureRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadPostCaptures(event: IonInfiniteScrollEvent) {
    return this.postCaptureRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  capture() {
    return defer(() => this.cameraService.capture())
      .pipe(
        concatMap(async photo => {
          const collectingCapture = new CaptureItem({});
          this.collectingCaptures$.next(
            // eslint-disable-next-line rxjs/no-subject-value
            this.collectingCaptures$.value.concat(collectingCapture)
          );

          await this.collectorService.runAndStore({
            [photo.base64]: { mimeType: photo.mimeType },
          });

          this.collectingCaptures$.next(
            // eslint-disable-next-line rxjs/no-subject-value
            without(this.collectingCaptures$.value, collectingCapture)
          );
        }),
        single(),
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
    unpublishedProofs = unpublishedProofs.filter(
      proof => !isEqual(proof, found)
    );
    items.push(new CaptureItem({ diaBackendAsset, proof: found }));
  }

  for (const unpublished of unpublishedProofs) {
    items.push(new CaptureItem({ proof: unpublished }));
  }

  return items;
}
