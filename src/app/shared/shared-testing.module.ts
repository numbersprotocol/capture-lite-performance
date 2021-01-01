import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoModule } from '@ngneat/transloco';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';
import { CapacitorPluginsTestingModule } from './core/capacitor-plugins/capacitor-plugins-testing.module';
import { getTranslocoTestingModule } from './core/transloco/transloco-testing.module';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    HttpClientTestingModule,
    RouterTestingModule,
    getTranslocoTestingModule(),
    TranslocoLocaleModule.init(),
    CapacitorPluginsTestingModule,
  ],
  exports: [
    SharedModule,
    RouterTestingModule,
    TranslocoModule,
    TranslocoLocaleModule,
  ],
})
export class SharedTestingModule {}
