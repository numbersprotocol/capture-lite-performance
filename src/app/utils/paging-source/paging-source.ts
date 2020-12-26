import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export class PagingSource<T> {
  private readonly _data$ = new BehaviorSubject<T[]>([]);
  readonly data$ = this._data$.asObservable();
  private currentOffset = 0;

  constructor(
    private readonly pagingGetAllFunction$: PagingGetAllFunction<T>,
    private readonly pagingSize = 20
  ) {}

  loadData$(event?: InfiniteScrollEvent) {
    return this.pagingGetAllFunction$({
      pagingSize: this.pagingSize,
      offset: this.currentOffset,
    }).pipe(
      tap(data => {
        if (data.length) {
          // eslint-disable-next-line rxjs/no-subject-value
          this._data$.next(this._data$.value.concat(data));
          this.currentOffset += data.length;
        }

        if (event) {
          if (data.length === 0) event.target.disabled = true;
          event.target.complete();
        }
      })
    );
  }
}

type PagingGetAllFunction<T> = (options: GetAllOptions) => Observable<T[]>;

export interface GetAllOptions {
  readonly pagingSize: number;
  readonly offset: number;
}

export interface InfiniteScrollEvent extends CustomEvent {
  readonly target: EventTarget & {
    disabled: boolean;
    complete(): void;
  };
}
