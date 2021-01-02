import { Component } from '@angular/core';
import { DiaBackendAuthService } from '../../shared/services/dia-backend/auth/dia-backend-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly username$ = this.diaBackendAuthService.username$;
  readonly email$ = this.diaBackendAuthService.email$;

  readonly pages = [
    {
      routerLink: '/home/capture',
      iconName: 'home-outline',
      labelText: 'index',
    },
    {
      routerLink: '/home/profile',
      iconName: 'person-outline',
      labelText: 'profile',
    },
    {
      routerLink: '/home/privacy',
      iconName: 'eye-outline',
      labelText: 'privacy',
    },
    {
      routerLink: '/home/settings',
      iconName: 'settings-outline',
      labelText: 'settings',
    },
  ];

  constructor(private readonly diaBackendAuthService: DiaBackendAuthService) {}
}
