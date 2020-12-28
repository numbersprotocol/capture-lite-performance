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

const CAPTURE_IMAGE_HEIGHT_PX = 110;
const POST_CAPTURE_IMAGE_HEIGHT_PX = 350;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage implements OnInit {
  private readonly captureSource = new PagingSource(options =>
    this.diaBackendAssetRepository.getAll$(options)
  );
  readonly chunkedCaptures$ = this.captureSource.data$.pipe(
    map(captures => chunk(captures, this.capturesPerRow))
  );
  readonly capturesPerRow = 3;
  readonly captureImageHeight = CAPTURE_IMAGE_HEIGHT_PX;

  private readonly postCaptureSource = new PagingSource(
    options => this.diaBackendAssetRepository.getAll$(options),
    10
  );
  readonly postCaptures$ = this.postCaptureSource.data$;
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
    this.captureSource.refresh$().pipe(untilDestroyed(this)).subscribe();
    this.postCaptureSource.refresh$().pipe(untilDestroyed(this)).subscribe();
  }

  trackById(_: number, item: DiaBackendAsset) {
    return item.id;
  }

  trackChunkedGroupByIds(_: number, item: DiaBackendAsset[]) {
    return item.map(i => i.id);
  }

  captureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const columnPaddingPx = 10;
    return CAPTURE_IMAGE_HEIGHT_PX + columnPaddingPx;
  }

  postCaptureColumnHeight(_item: DiaBackendAsset, _index: number) {
    const imageMarginPx = 16;
    return POST_CAPTURE_IMAGE_HEIGHT_PX + imageMarginPx;
  }

  loadCaptures(event: InfiniteScrollEvent) {
    return this.captureSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadPostCaptures(event: InfiniteScrollEvent) {
    return this.postCaptureSource
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
