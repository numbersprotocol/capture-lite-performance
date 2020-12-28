import { HttpClient } from '@angular/common/http';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { blobToBase64 } from '../../../utils/encoding/encoding';
import { MimeType } from '../../../utils/mime-type';
import { Database } from '../../services/database/database.service';
import { OnConflictStrategy, Tuple } from '../../services/database/table/table';
import { CacheStore } from '../../services/file-store/cache/cache';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-img',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ImageComponent {
  @Input() cacheBy?: string;
  @Input() set src(value: string) {
    this.updateUrl(value);
  }

  private readonly cacheTable = this.database.getTable<Cache>(
    `${ImageComponent.name}_cache`
  );
  private readonly _url$ = new BehaviorSubject<string | undefined>(undefined);
  readonly url$ = this._url$.asObservable();
  private readonly _isLoading$ = new BehaviorSubject(false);
  readonly isLoading$ = this._isLoading$.asObservable();

  constructor(
    private readonly database: Database,
    private readonly cacheStore: CacheStore,
    private readonly httpClient: HttpClient
  ) {}

  private async updateUrl(src: string) {
    const caches = await this.cacheTable.queryAll();
    const cache = caches.find(
      cache => cache.key === this.cacheBy || cache.key === src
    );
    if (!cache) return this.setUrlFromSrcAndCacheSrc(src);
    const cacheBase64 = await this.cacheStore.readCache(cache.fileIndex);
    if (!cacheBase64) return this.setUrlFromSrcAndCacheSrc(src);
    console.log('hit');

    this._url$.next(`data:image/*;base64,${cacheBase64}`);
  }

  private setUrlFromSrcAndCacheSrc(src: string) {
    console.log('miss');

    this._url$.next(src);

    this.httpClient
      .get(src, { responseType: 'blob' })
      .pipe(
        concatMap(async blob => {
          const base64 = await blobToBase64(blob);
          return this.cacheStore.write(base64, blob.type as MimeType);
        }),
        concatMap(async fileIndex => {
          const caches = [{ key: src, fileIndex }];
          if (this.cacheBy) caches.push({ key: this.cacheBy, fileIndex });
          this.cacheTable.insert(caches, OnConflictStrategy.IGNORE);
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  imageWillLoad() {
    this._isLoading$.next(true);
  }

  imageDidLoad() {
    this._isLoading$.next(false);
  }
}

interface Cache extends Tuple {
  key: string;
  fileIndex: string;
}
