import { BehaviorSubject, Observable } from 'rxjs';
import { single, tap } from 'rxjs/operators';
import { IonInfiniteScrollEvent } from '../events';

export class PagingSource<T> {
  private readonly _data$ = new BehaviorSubject<T[]>([]);
  readonly data$ = this._data$.asObservable();
  private currentOffset = 0;

  constructor(
    private readonly pagingFetchAllFunction$: PagingFetchFunction<T>,
    private readonly pagingSize = 20
  ) {}

  refresh$() {
    this.currentOffset = 0;
    return this.pagingFetchAllFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      single(),
      tap(data => {
        this._data$.next(data);
        this.currentOffset += data.length;
      })
    );
  }

  loadData$(event: IonInfiniteScrollEvent) {
    return this.pagingFetchAllFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      single(),
      tap(data => {
        if (data.length) {
          // eslint-disable-next-line rxjs/no-subject-value
          this._data$.next(this._data$.value.concat(data));
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
