import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonInfiniteScroll } from '@ionic/angular';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { defer } from 'rxjs';
import {
  concatMap,
  concatMapTo,
  first,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import { BlockingAction } from '../../../../../shared/services/blocking-action/blocking-action.service';
import { ConfirmAlert } from '../../../../../shared/services/confirm-alert/confirm-alert.service';
import { DiaBackendAssetRepository } from '../../../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { DiaBackendAuthService } from '../../../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import {
  DiaBackendContact,
  DiaBackendContactRepository,
} from '../../../../../shared/services/dia-backend/contact/dia-backend-contact-repository.service';
import { DiaBackendTransactionRepository } from '../../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { PagingSourceManager } from '../../../../../shared/services/paging-source-manager/paging-source-manager.service';
import { getOldProof } from '../../../../../shared/services/repositories/proof/old-proof-adapter';
import { ProofRepository } from '../../../../../shared/services/repositories/proof/proof-repository.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
  IonSlidesEvent,
} from '../../../../../utils/events';
import {
  isNonNullable,
  switchTap,
} from '../../../../../utils/rx-operators/rx-operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-sending-post-capture',
  templateUrl: './sending-post-capture.page.html',
  styleUrls: ['./sending-post-capture.page.scss'],
})
export class SendingPostCapturePage implements OnInit {
  readonly titles = ['selectContact', 'writeMessage', 'sendPostCapture'];
  private readonly initialSlideIndex = 0;
  currentSlideIndex = this.initialSlideIndex;
  readonly slidesOptions = { initialSlide: this.initialSlideIndex };

  private readonly contactRemoteSource = this.pagingSourceManager.getPagingSource(
    {
      id: `${DiaBackendContactRepository.name}_fetchAll`,
      pagingFetchFunction$: options =>
        this.diaBackendContactRepository.fetchAll$(options).pipe(first()),
      pagingSize: 50,
    }
  );
  readonly contacts$ = this.contactRemoteSource.data$;
  readonly isContactsFetching$ = this.diaBackendContactRepository.isFetching$;

  readonly asset$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    isNonNullable(),
    switchMap(id => this.diaBackendAssetRepository.fetchById$(id)),
    first(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly userEmail$ = this.diaBackendAuthService.email$;

  message = '';
  targetContact?: DiaBackendContact;

  constructor(
    private readonly diaBackendContactRepository: DiaBackendContactRepository,
    private readonly route: ActivatedRoute,
    private readonly diaBackendAssetRepository: DiaBackendAssetRepository,
    private readonly diaBackendAuthService: DiaBackendAuthService,
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly proofRepository: ProofRepository,
    private readonly router: Router,
    private readonly confirmAlert: ConfirmAlert,
    private readonly blockingAction: BlockingAction,
    private readonly translocoService: TranslocoService,
    private readonly pagingSourceManager: PagingSourceManager
  ) {}

  ngOnInit() {
    this.refreshContacts();
  }

  async onSlidesDidChange(event: IonSlidesEvent) {
    this.currentSlideIndex = await event.target.getActiveIndex();
  }

  refreshContacts(
    event?: IonRefresherEvent,
    ionInfiniteScroll?: IonInfiniteScroll
  ) {
    return this.contactRemoteSource
      .refresh$(event, ionInfiniteScroll)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  loadContacts(event: IonInfiniteScrollEvent) {
    return this.contactRemoteSource
      .loadData$(event)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  trackByEmail(_: number, item: DiaBackendContact) {
    return item.contact_email;
  }

  inviteFriend(invitedEmail?: string | number | null) {
    this.targetContact = { contact_email: String(invitedEmail) };
  }

  async send(targetEmail: string) {
    const action$ = this.asset$.pipe(
      first(),
      switchTap(asset =>
        this.diaBackendTransactionRepository.add$(
          asset.id,
          targetEmail,
          this.message
        )
      ),
      concatMap(async asset => {
        const proofs = await this.proofRepository.getAll();
        const found = proofs.find(
          proof => getOldProof(proof).hash === asset.proof_hash
        );
        if (found) await this.proofRepository.remove(found);
      }),
      concatMapTo(
        defer(() => {
          this.diaBackendAssetRepository.setIsDirty('send_post_capture');
          return this.router.navigate(['../..'], { replaceUrl: true });
        })
      )
    );

    const result = await this.confirmAlert.present(
      this.translocoService.translate('message.sendPostCaptureAlert')
    );
    if (result) {
      this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
    }
  }
}
