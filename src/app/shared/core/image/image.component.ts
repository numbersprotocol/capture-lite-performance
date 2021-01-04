import { HttpClient } from '@angular/common/http';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isEqual } from 'lodash-es';
import { BehaviorSubject, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  switchAll,
  switchMap,
  tap,
} from 'rxjs/operators';
import { blobToBase64 } from '../../../utils/encoding/encoding';
import { MimeType } from '../../../utils/mime-type';
import { isNonNullable } from '../../../utils/rx-operators/rx-operators';
import { toDataUrl } from '../../../utils/url';
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
  @Input() readonly cacheKey?: string;
  @Input()
  set src(value: string) {
    this._src$.next(value);
  }
  private readonly _src$ = new BehaviorSubject<string | undefined>(undefined);
  private readonly src$ = this._src$.asObservable().pipe(
    isNonNullable(),
    distinctUntilChanged<string>(isEqual),
    tap(() => (this.isError = false))
  );
  readonly url$ = this.src$.pipe(
    switchMap(src => this.updateUrl(src)),
    switchAll()
  );

  private readonly cacheTable = this.database.getTable<Cache>(
    `${ImageComponent.name}_cache`
  );
  isLoading = true;
  isError = false;

  constructor(
    private readonly database: Database,
    private readonly cacheStore: CacheStore,
    private readonly httpClient: HttpClient
  ) {}

  private async updateUrl(src: string) {
    const caches = await this.cacheTable.queryAll();
    const cache = caches.find(
      cache => cache.key === this.cacheKey || cache.key === src
    );
    if (!cache) return this.cacheSrc$(src);
    const cacheBase64 = await this.cacheStore.readCache(cache.fileIndex);
    if (!cacheBase64) return this.cacheSrc$(src);
    return of(toDataUrl(cacheBase64, 'image/*'));
  }

  private cacheSrc$(src: string) {
    return this.httpClient.get(src, { responseType: 'blob' }).pipe(
      switchMap(async blob => {
        const base64 = await blobToBase64(blob);
        const fileIndex = await this.cacheStore.write(
          base64,
          blob.type as MimeType
        );
        const caches = [{ key: src, fileIndex }];
        if (this.cacheKey) caches.push({ key: this.cacheKey, fileIndex });
        await this.cacheTable.insert(caches, OnConflictStrategy.IGNORE);

        return toDataUrl(base64, blob.type);
      }),
      catchError(() => of(src))
    );
  }

  imageWillLoad() {
    this.isLoading = true;
    this.isError = false;
  }

  imageDidLoad() {
    this.isLoading = false;
  }

  imageError() {
    this.isLoading = false;
    this.isError = true;
  }
}

interface Cache extends Tuple {
  key: string;
  fileIndex: string;
}
