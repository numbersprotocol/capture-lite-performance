import { Component } from '@angular/core';
import { CapacitorFactsProvider } from '../../../shared/services/collector/facts/capacitor-facts-provider/capacitor-facts-provider.service';
import { IonToggleEvent } from '../../../utils/events';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage {
  readonly isDeviceInfoCollectionEnabled$ = this.capacitorFactsProvider
    .isDeviceInfoCollectionEnabled$;
  readonly isLocationInfoCollectionEnabled$ = this.capacitorFactsProvider
    .isGeolocationInfoCollectionEnabled$;

  constructor(
    private readonly capacitorFactsProvider: CapacitorFactsProvider
  ) {}

  async setDeviceInfoCollection(event: IonToggleEvent) {
    return this.capacitorFactsProvider.setDeviceInfoCollection(
      event.target.checked
    );
  }

  async setGeolocationInfoCollection(event: IonToggleEvent) {
    return this.capacitorFactsProvider.setGeolocationInfoCollection(
      event.target.checked
    );
  }
}
