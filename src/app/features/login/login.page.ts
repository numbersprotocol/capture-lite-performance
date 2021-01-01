import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlockingAction } from '../../shared/services/blocking-action/blocking-action.service';
import { DiaBackendAuthService } from '../../shared/services/dia-backend/auth/dia-backend-auth.service';
import { EMAIL_REGEXP } from '../../utils/validation';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  readonly form = new FormGroup({});
  readonly model: LoginFormModel = { email: '', password: '' };
  readonly fields$: Observable<FormlyFieldConfig[]> = this.translocoService
    .selectTranslateObject({
      email: null,
      password: null,
      'message.pleaseEnterValidEmail': null,
    })
    .pipe(
      map(
        ([
          translatedEmail,
          translatedPassword,
          translatedPleaseEnterValidEmail,
        ]) => [
          {
            key: 'email',
            type: 'input',
            templateOptions: {
              type: 'email',
              placeholder: translatedEmail,
              required: true,
              hideRequiredMarker: true,
              pattern: EMAIL_REGEXP,
            },
            validation: {
              messages: { pattern: () => translatedPleaseEnterValidEmail },
            },
          },
          {
            key: 'password',
            type: 'input',
            templateOptions: {
              type: 'password',
              placeholder: translatedPassword,
              required: true,
              hideRequiredMarker: true,
            },
          },
        ]
      )
    );

  constructor(
    private readonly diaBackendAuthService: DiaBackendAuthService,
    private readonly blockingAction: BlockingAction,
    private readonly router: Router,
    private readonly translocoService: TranslocoService
  ) {}

  submit() {
    const action$ = this.diaBackendAuthService.login$(
      this.model.email,
      this.model.password
    );

    this.blockingAction
      .run$(action$)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.router.navigate(['home'], { replaceUrl: true }));
  }
}

interface LoginFormModel {
  email: string;
  password: string;
}
