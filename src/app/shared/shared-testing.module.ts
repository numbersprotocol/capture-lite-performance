import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { CapacitorPluginsTestingModule } from './core/capacitor-plugins/capacitor-plugins-testing.module';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    HttpClientTestingModule,
    RouterTestingModule,
    CapacitorPluginsTestingModule,
  ],
  exports: [SharedModule, RouterTestingModule],
})
export class SharedTestingModule {}
