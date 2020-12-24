import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { CapacitorPluginsTestingModule } from './core/capacitor-plugins/capacitor-plugins-testing.module';
import { DiaBackendAuthTestingService } from './services/dia-backend/auth/dia-backend-auth-testing.service';
import { DiaBackendAuthService } from './services/dia-backend/auth/dia-backend-auth.service';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    HttpClientTestingModule,
    RouterTestingModule,
    CapacitorPluginsTestingModule,
  ],
  providers: [
    {
      provide: DiaBackendAuthService,
      useClass: DiaBackendAuthTestingService,
    },
  ],
  exports: [SharedModule, RouterTestingModule],
})
export class SharedTestingModule {}
