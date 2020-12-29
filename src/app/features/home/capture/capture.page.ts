import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chunk } from 'lodash-es';
import { defer } from 'rxjs';
import { concatMap, map, single, tap } from 'rxjs/operators';
import { CameraService } from '../../../shared/services/camera/camera.service';
import { CollectorService } from '../../../shared/services/collector/collector.service';
import {
  DiaBackendAsset,
  DiaBackendAssetRepository,
} from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import {
  InfiniteScrollEvent,
  PagingSource,
} from '../../../utils/paging-source/paging-source';
import { CaptureItem } from './capture-item/capture-item.component';

const CAPTURE_ITEM_HEIGHT_PX = 110;
const POST_CAPTURE_IMAGE_HEIGHT_PX = 350;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage implements OnInit {
  private readonly captureRemoteSource = new PagingSource(options =>
    this.diaBackendAssetRepository.getAll$(options)
  );
  readonly chunkedCaptures$ = this.captureRemoteSource.data$.pipe(
    map(diaBackendAssets =>
      diaBackendAssets.map(
        diaBackendAsset => new CaptureItem({ diaBackendAsset })
      )
    ),
    map(captures => chunk(captures, this.capturesPerRow))
  );
  readonly capturesPerRow = 3;
  readonly captureItemHeight = CAPTURE_ITEM_HEIGHT_PX;

  private readonly postCaptureRemoteSource = new PagingSource(
    options => this.diaBackendAssetRepository.getAll$(options),
    10
  );
  readonly postCaptures$ = this.postCaptureRemoteSource.data$;
  readonly postCaptureImageHeight = POST_CAPTURE_IMAGE_HEIGHT_PX;

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly cameraService: CameraService,
    private readonly collectorService: CollectorService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.captureRemoteSource.refresh$().pipe(untilDestroyed(this)).subscribe();
    this.postCaptureRemoteSource
      .refresh$()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackById(_: number, item: DiaBackendAsset) {
    return item.id;
  }

  trackChunkedGroupByIds(_: number, item: DiaBackendAsset[]) {
    return item.map(i => i.id);
  }

  captureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const columnPaddingPx = 10;
    return CAPTURE_ITEM_HEIGHT_PX + columnPaddingPx;
  }

  postCaptureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const imageMarginPx = 16;
    return POST_CAPTURE_IMAGE_HEIGHT_PX + imageMarginPx;
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
        tap(() => this.refresh()),
        untilDestroyed(this)
      )
      .subscribe();
  }
}
