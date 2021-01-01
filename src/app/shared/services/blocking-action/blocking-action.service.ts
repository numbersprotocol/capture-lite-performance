import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { LoadingOptions } from '@ionic/core';
import { TranslocoService } from '@ngneat/transloco';
import { defer, Observable } from 'rxjs';
import { concatMap, concatMapTo, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BlockingAction {
  constructor(
    private readonly loadingController: LoadingController,
    private readonly translocoService: TranslocoService
  ) {}

  run$<T>(
    action$: Observable<T>,
    opts: Partial<LoadingOptions> = {
      message: this.translocoService.translate('pleaseWait'),
    }
  ) {
    return defer(() => this.loadingController.create({ ...opts })).pipe(
      concatMap(loading => run$(action$, loading))
    );
  }
}

function run$<T>(action$: Observable<T>, loading: HTMLIonLoadingElement) {
  return defer(() => loading.present()).pipe(
    concatMapTo(action$),
    finalize(() => loading.dismiss())
  );
}
