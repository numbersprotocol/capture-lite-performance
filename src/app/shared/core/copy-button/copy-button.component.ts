import { Component, Input } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { ToastController } from '@ionic/angular';
import { TranslocoService } from '@ngneat/transloco';

const { Clipboard } = Plugins;

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
})
export class CopyButtonComponent {
  @Input() value!: string;

  constructor(
    private readonly toastController: ToastController,
    private readonly translocoService: TranslocoService
  ) {}

  async copy() {
    await Clipboard.write({ string: this.value });
    const toast = await this.toastController.create({
      message: this.translocoService.translate('message.copiedToClipboard'),
      duration: 1000,
    });
    return toast.present();
  }
}
