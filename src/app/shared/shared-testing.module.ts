import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { CapacitorPluginsTestingModule } from './core/capacitor-plugins/capacitor-plugins-testing.module';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    IonicModule,
    HttpClientTestingModule,
    RouterTestingModule,
    CapacitorPluginsTestingModule,
  ],
  exports: [IonicModule],
})
export class SharedTestingModule {}
