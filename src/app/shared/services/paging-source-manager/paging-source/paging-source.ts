import { IonInfiniteScroll } from '@ionic/angular';
import { BehaviorSubject, defer, Observable } from 'rxjs';
import { catchError, concatMapTo, single, tap } from 'rxjs/operators';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
} from '../../../../utils/events';
import {
  isNonNullable,
  switchTap,
} from '../../../../utils/rx-operators/rx-operators';
import { Database } from '../../database/database.service';
import { OnConflictStrategy, Tuple } from '../../database/table/table';

export class PagingSource<T extends Tuple> {
  private readonly _data$ = new BehaviorSubject<T[] | undefined>(undefined);
  readonly data$ = this._data$.asObservable().pipe(isNonNullable());
  private currentOffset = 0;

  private readonly cacheTable = this.database.getTable<CachedData<T>>(
    `${PagingSource.name}_${this.id}_cache`
  );

  constructor(
    private readonly id: string,
    private readonly pagingFetchFunction$: PagingFetchFunction<T>,
    private readonly pagingSize: number,
    private readonly database: Database
  ) {}

  refresh$(event?: IonRefresherEvent, ionInfiniteScroll?: IonInfiniteScroll) {
    return defer(async () => (this.currentOffset = 0)).pipe(
      concatMapTo(
        defer(() =>
          this.pagingFetchFunction$({
            pagingSize: this.pagingSize,
            offset: this.currentOffset,
          })
        )
      ),
      switchTap(data => this.insertCurrentPagingData(data, this.currentOffset)),
      catchError(() =>
        defer(() => this.queryCurrentPagingCache(this.currentOffset))
      ),
      tap(data => {
        this._data$.next(data);
        this.currentOffset += data.length;
        if (ionInfiniteScroll) ionInfiniteScroll.disabled = false;
        event?.target.complete();
      }),
      single()
    );
  }

  loadData$(event: IonInfiniteScrollEvent) {
    return this.pagingFetchFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      switchTap(data => this.insertCurrentPagingData(data, this.currentOffset)),
      catchError(() =>
        defer(() => this.queryCurrentPagingCache(this.currentOffset))
      ),
      tap(data => {
        if (data.length) {
          // eslint-disable-next-line rxjs/no-subject-value
          const next = this._data$.value ?? [];
          next.splice(this.currentOffset, data.length, ...data);
          this._data$.next(next);
          this.currentOffset += data.length;
        }
        if (data.length === 0) event.target.disabled = true;
        event.target.complete();
      }),
      single()
    );
  }

  private async queryCurrentPagingCache(currentOffset: number) {
    const data = await this.cacheTable.queryAll();
    return data
      .filter(
        d =>
          d.index >= currentOffset && d.index < currentOffset + this.pagingSize
      )
      .sort((a, b) => a.index - b.index)
      .map(d => d.data);
  }

  private async insertCurrentPagingData(data: T[], currentOffset: number) {
    return this.cacheTable.insert(
      data.map((d, index) => ({ data: d, index: currentOffset + index })),
      OnConflictStrategy.REPLACE,
      (x, y) => x.index === y.index
    );
  }
}

interface CachedData<T extends Tuple> extends Tuple {
  readonly data: T;
  readonly index: number;
}

export type PagingFetchFunction<T> = (
  options: PagingFetchFunctionOptions
) => Observable<T[]>;

export interface PagingFetchFunctionOptions {
  readonly pagingSize: number;
  readonly offset: number;
}
