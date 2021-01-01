import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LanguageService } from '../../../shared/services/language/language.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly languages = this.languageService.languages;
  readonly currentLanguageKey$ = this.languageService.currentLanguageKey$;

  constructor(private readonly languageService: LanguageService) {}

  async setCurrentLanguage(languageKey: string) {
    return this.languageService.setCurrentLanguage(languageKey);
  }
}
