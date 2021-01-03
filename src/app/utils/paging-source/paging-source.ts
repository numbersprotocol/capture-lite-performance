import { IonInfiniteScroll } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IonInfiniteScrollEvent, IonRefresherEvent } from '../events';

export class PagingSource<T> {
  private readonly _data$ = new BehaviorSubject<T[]>([]);
  readonly data$ = this._data$.asObservable();
  private currentOffset = 0;

  constructor(
    private readonly pagingFetchFunction$: PagingFetchFunction<T>,
    private readonly pagingSize = 20
  ) {}

  refresh$(event?: IonRefresherEvent, ionInfiniteScroll?: IonInfiniteScroll) {
    this.currentOffset = 0;
    return this.pagingFetchFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      tap(data => {
        this._data$.next(data);
        this.currentOffset += data.length;
        if (ionInfiniteScroll) ionInfiniteScroll.disabled = false;
        event?.target.complete();
      })
    );
  }

  loadData$(event: IonInfiniteScrollEvent) {
    return this.pagingFetchFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      tap(data => {
        if (data.length) {
          // eslint-disable-next-line rxjs/no-subject-value
          const next = this._data$.value;
          next.splice(this.currentOffset, data.length, ...data);
          this._data$.next(next);
          this.currentOffset += data.length;
        }
        if (data.length === 0) event.target.disabled = true;
        event.target.complete();
      })
    );
  }
}

type PagingFetchFunction<T> = (
  options: PagingFetchFunctionOptions
) => Observable<T[]>;

export interface PagingFetchFunctionOptions {
  readonly pagingSize: number;
  readonly offset: number;
}
