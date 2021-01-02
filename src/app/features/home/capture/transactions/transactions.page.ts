import { Component, OnInit } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first, tap } from 'rxjs/operators';
import { DiaBackendAuthService } from '../../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import {
  DiaBackendTransaction,
  DiaBackendTransactionRepository,
} from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
} from '../../../../utils/events';
import { PagingSource } from '../../../../utils/paging-source/paging-source';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit {
  readonly isFetching$ = this.diaBackendTransactionRepository.isFetching$;
  private readonly transactionRemoteSource = new PagingSource(options =>
    this.diaBackendTransactionRepository.fetchAll$(options).pipe(first())
  );
  readonly transactions$ = this.transactionRemoteSource.data$;
  readonly email$ = this.diaBackendAuthService.getEmail$;

  constructor(
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly diaBackendAuthService: DiaBackendAuthService
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
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadTransactions(event: IonInfiniteScrollEvent) {
    return this.transactionRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackByIdAndStatus(_: number, item: DiaBackendTransaction) {
    return `${item.id}, ${item.expired}, ${item.fulfilled_at}`;
  }
}
