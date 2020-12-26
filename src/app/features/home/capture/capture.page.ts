import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chunk } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  DiaBackendAsset,
  DiaBackendAssetRepository,
} from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';

const CAPTURE_IMAGE_HEIGHT_PX = 110;
const POST_CAPTURE_IMAGE_HEIGHT_PX = 350;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-capture',
  templateUrl: './capture.page.html',
  styleUrls: ['./capture.page.scss'],
})
export class CapturePage implements OnInit {
  private readonly _captures$ = new BehaviorSubject<DiaBackendAsset[]>([]);
  readonly chunkedCaptures$ = this._captures$
    .asObservable()
    .pipe(map(captures => chunk(captures, this.capturesPerRow)));
  readonly capturesPerRow = 3;
  private readonly captureLimit = 20;
  private currentCaptureOffset = 0;
  readonly captureImageHeight = CAPTURE_IMAGE_HEIGHT_PX;

  private readonly _postCaptures$ = new BehaviorSubject<DiaBackendAsset[]>([]);
  readonly postCaptures$ = this._postCaptures$.asObservable();
  private readonly postCaptureLimit = 10;
  private readonly currentPostCaptureOffset = 0;
  readonly postCaptureImageHeight = POST_CAPTURE_IMAGE_HEIGHT_PX;

  constructor(
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository
  ) {}

  ngOnInit() {
    this.appendAssets$(this._captures$, this.captureLimit)
      .pipe(untilDestroyed(this))
      .subscribe();
    this.appendAssets$(this._postCaptures$, this.postCaptureLimit)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackById(_: number, item: DiaBackendAsset) {
    return item.id;
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
    return this.appendAssets$(this._captures$, this.captureLimit)
      .pipe(
        tap(assets => {
          if (assets.length === 0) event.target.disabled = true;
          event.target.complete();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  loadPostCaptures(event: InfiniteScrollEvent) {
    return this.appendAssets$(this._postCaptures$, this.postCaptureLimit)
      .pipe(
        tap(assets => {
          if (assets.length === 0) event.target.disabled = true;
          event.target.complete();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private appendAssets$(
    assetSubject$: BehaviorSubject<DiaBackendAsset[]>,
    limit: number
  ) {
    return this.diaBackendAssetRepository
      .getAll$({ limit, offset: this.currentCaptureOffset })
      .pipe(
        tap(assets => {
          if (assets.length) {
            // eslint-disable-next-line rxjs/no-subject-value
            assetSubject$.next([...assetSubject$.value, ...assets]);
            this.currentCaptureOffset += assets.length;
          }
        })
      );
  }
}

interface InfiniteScrollEvent extends CustomEvent {
  readonly target: EventTarget & {
    disabled: boolean;
    complete(): void;
  };
}
