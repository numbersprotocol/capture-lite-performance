import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CapacitorPluginsModule } from './core/capacitor-plugins/capacitor-plugins.module';
import { ImageComponent } from './core/image/image.component';
import { PostCaptureComponent } from './core/post-capture/post-capture.component';
import { TransactionStatusPipe } from './pipes/transaction-status/transaction-status.pipe';

@NgModule({
  declarations: [ImageComponent, PostCaptureComponent, TransactionStatusPipe],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule,
    CapacitorPluginsModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImageComponent,
    PostCaptureComponent,
    TransactionStatusPipe,
  ],
})
export class SharedModule {}
