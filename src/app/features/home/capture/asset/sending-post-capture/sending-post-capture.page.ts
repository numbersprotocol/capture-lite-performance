import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonInfiniteScroll } from '@ionic/angular';
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
import { getOldProof } from '../../../../../shared/services/repositories/proof/old-proof-adapter';
import { ProofRepository } from '../../../../../shared/services/repositories/proof/proof-repository.service';
import {
  IonInfiniteScrollEvent,
  IonRefresherEvent,
  IonSlidesEvent,
} from '../../../../../utils/events';
import { PagingSource } from '../../../../../utils/paging-source/paging-source';
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

  private readonly contactRemoteSource = new PagingSource(
    options =>
      this.diaBackendContactRepository.fetchAll$(options).pipe(first()),
    50
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

  readonly userEmail$ = this.diaBackendAuthService.getEmail$;

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
    private readonly blockingAction: BlockingAction
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

  async inviteFriend(invitedEmail: string) {
    this.targetContact = { contact_email: invitedEmail };
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
      'After a PostCapture is sent, the ownership will be transferred to the selected friend. Are you sure?'
    );
    if (result) {
      this.blockingAction.run$(action$).pipe(untilDestroyed(this)).subscribe();
    }
  }
}
