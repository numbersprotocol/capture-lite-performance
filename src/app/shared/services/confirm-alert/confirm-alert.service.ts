import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ConfirmAlert {
  constructor(private readonly alertController: AlertController) {}

  async present(message: string = 'Are You Sure?') {
    return new Promise<boolean>(resolve => {
      this.alertController
        .create({
          header: 'Are You Sure',
          message,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => resolve(false),
            },
            {
              text: 'OK',
              handler: () => resolve(true),
            },
          ],
        })
        .then(alertElement => alertElement.present());
    });
  }
}
