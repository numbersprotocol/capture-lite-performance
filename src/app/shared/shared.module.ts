import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoModule } from '@ngneat/transloco';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';
import { CapacitorPluginsModule } from './core/capacitor-plugins/capacitor-plugins.module';
import { CopyButtonComponent } from './core/copy-button/copy-button.component';
import { ImageComponent } from './core/image/image.component';
import { NoDataComponent } from './core/no-data/no-data.component';
import { PostCaptureComponent } from './core/post-capture/post-capture.component';
import { TransactionStatusPipe } from './services/dia-backend/transaction/transaction-status/transaction-status.pipe';

@NgModule({
  declarations: [
    ImageComponent,
    PostCaptureComponent,
    NoDataComponent,
    CopyButtonComponent,
    TransactionStatusPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule,
    TranslocoModule,
    TranslocoLocaleModule,
    CapacitorPluginsModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslocoModule,
    TranslocoLocaleModule,
    ImageComponent,
    PostCaptureComponent,
    NoDataComponent,
    CopyButtonComponent,
    TransactionStatusPipe,
  ],
})
export class SharedModule {}
