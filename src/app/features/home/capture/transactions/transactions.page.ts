import { Component, OnInit } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first, tap } from 'rxjs/operators';
import { DiaBackendAuthService } from '../../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import {
  DiaBackendTransaction,
  DiaBackendTransactionRepository,
} from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { PagingSourceManager } from '../../../../shared/services/paging-source-manager/paging-source-manager.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
} from '../../../../utils/events';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit {
  readonly isFetching$ = this.diaBackendTransactionRepository.isFetching$;
  private readonly transactionRemoteSource = this.pagingSourceManager.getPagingSource(
    {
      id: `${DiaBackendTransactionRepository.name}_fetchAll`,
      pagingFetchFunction$: options =>
        this.diaBackendTransactionRepository.fetchAll$(options).pipe(first()),
      pagingSize: 20,
    }
  );
  readonly transactions$ = this.transactionRemoteSource.data$;
  readonly email$ = this.diaBackendAuthService.email$;

  constructor(
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly diaBackendAuthService: DiaBackendAuthService,
    private readonly pagingSourceManager: PagingSourceManager
  ) {}

  ngOnInit() {
    this.refreshTransactions();

    this.diaBackendTransactionRepository.isDirtyEvent$
      .pipe(
        tap(() => this.refreshTransactions()),
        untilDestroyed(this)
      )
      .subscribe();
  }

  refreshTransactions(
    event?: IonRefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    return this.transactionRemoteSource
      .refresh$(event, ionInfiniteScroll)
      .pipe(first(), untilDestroyed(this))
      .subscribe();
  }

  loadTransactions(event: IonInfiniteScrollEvent) {
    return this.transactionRemoteSource
      .loadData$(event)
      .pipe(first(), untilDestroyed(this))
      .subscribe();
  }

  trackByIdAndState(_: number, item: DiaBackendTransaction) {
    return `${item.id}, ${item.expired}, ${item.fulfilled_at}`;
  }
}
