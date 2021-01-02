import { Component, OnInit } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
import { BlockingAction } from '../../../../shared/services/blocking-action/blocking-action.service';
import { DiaBackendAuthService } from '../../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import {
  DiaBackendTransaction,
  DiaBackendTransactionRepository,
} from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { IgnoredTransactionRepository } from '../../../../shared/services/dia-backend/transaction/ignored-transaction-repository.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
} from '../../../../utils/events';
import { PagingSource } from '../../../../utils/paging-source/paging-source';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
})
export class InboxPage implements OnInit {
  readonly isFetching$ = this.diaBackendTransactionRepository.isFetching$;
  private readonly inboxRemoteSource = new PagingSource(options =>
    this.diaBackendTransactionRepository.fetchInbox$(options).pipe(first())
  );
  readonly inbox$ = combineLatest([
    this.inboxRemoteSource.data$,
    this.ignoredTransactionRepository.getAll$(),
  ]).pipe(
    map(([transactions, ignoredTransactions]) =>
      transactions.filter(
        transaction => !ignoredTransactions.includes(transaction.id)
      )
    )
  );
  readonly email$ = this.diaBackendAuthService.email$;

  constructor(
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly ignoredTransactionRepository: IgnoredTransactionRepository,
    private readonly diaBackendAuthService: DiaBackendAuthService,
    private readonly blockingAction: BlockingAction
  ) {}

  ngOnInit() {
    this.refreshInbox();

    this.diaBackendTransactionRepository.isDirtyEvent$
      .pipe(
        tap(() => this.refreshInbox()),
        untilDestroyed(this)
      )
      .subscribe();
  }

  refreshInbox(
    event?: IonRefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    return this.inboxRemoteSource
      .refresh$(event, ionInfiniteScroll)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadInbox(event: IonInfiniteScrollEvent) {
    return this.inboxRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackByIdAndStatus(_: number, item: DiaBackendTransaction) {
    return `${item.id}, ${item.expired}, ${item.fulfilled_at}`;
  }

  accept(id: string) {
    const action$ = this.diaBackendTransactionRepository
      .accept$(id)
      .pipe(first());

    this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
  }

  async ignore(id: string) {
    return this.ignoredTransactionRepository.add(id);
  }
}
