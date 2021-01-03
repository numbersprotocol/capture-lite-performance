import { Injectable } from '@angular/core';
import { Database } from '../database/database.service';
import { Tuple } from '../database/table/table';
import {
  PagingFetchFunction,
  PagingSource,
} from './paging-source/paging-source';

@Injectable({
  providedIn: 'root',
})
export class PagingSourceManager {
  private readonly pagingSourcesMap = new Map<string, PagingSource<any>>();

  constructor(private readonly database: Database) {}

  getPagingSource<T extends Tuple>({
    id,
    pagingFetchFunction$,
    pagingSize,
  }: CreatePagingSourceParams<T>): PagingSource<T> {
    if (this.pagingSourcesMap.has(id)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.pagingSourcesMap.get(id)!;
    }
    return this.createPagingSource({
      id,
      pagingFetchFunction$,
      pagingSize,
    });
  }

  private createPagingSource<T extends Tuple>({
    id,
    pagingFetchFunction$,
    pagingSize,
  }: CreatePagingSourceParams<T>) {
    const created = new PagingSource(
      id,
      pagingFetchFunction$,
      pagingSize,
      this.database
    );
    this.pagingSourcesMap.set(id, created);
    return created;
  }
}

interface CreatePagingSourceParams<T extends Tuple> {
  readonly id: string;
  readonly pagingFetchFunction$: PagingFetchFunction<T>;
  readonly pagingSize: number;
}
