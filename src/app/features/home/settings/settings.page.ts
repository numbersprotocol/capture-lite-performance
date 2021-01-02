import { Component } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { defer } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { LanguageService } from '../../../shared/services/language/language.service';

const { Device } = Plugins;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly languages = this.languageService.languages;
  readonly currentLanguageKey$ = this.languageService.currentLanguageKey$;
  readonly version$ = defer(() => Device.getInfo()).pipe(pluck('appVersion'));

  constructor(private readonly languageService: LanguageService) {}

  async setCurrentLanguage(languageKey: string) {
    return this.languageService.setCurrentLanguage(languageKey);
  }
}
