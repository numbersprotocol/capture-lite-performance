import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { defer, forkJoin, Observable } from 'rxjs';
import { concatMap, concatMapTo, filter, map, timeout } from 'rxjs/operators';
import { PreferenceManager } from '../../preference-manager/preference-manager.service';
import { BASE_URL } from '../secret';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAuthService {
  private readonly preferences = this.preferenceManager.getPreferences(
    DiaBackendAuthService.name
  );

  private readonly token$ = this.preferences
    .getString$(PrefKeys.TOKEN)
    .pipe(filter(token => token.length !== 0));
  readonly hasLoggedIn$ = this.preferences
    .getString$(PrefKeys.TOKEN)
    .pipe(map(token => token !== ''));

  readonly username$ = this.preferences.getString$(PrefKeys.USERNAME);
  readonly email$ = this.preferences.getString$(PrefKeys.EMAIL);
  readonly authHeaders$ = this.token$.pipe(
    map(token => ({ authorization: `token ${token}` }))
  );

  constructor(
    private readonly httpClient: HttpClient,
    private readonly preferenceManager: PreferenceManager
  ) {}

  login$(email: string, password: string): Observable<LoginResult> {
    const timeoutMillis = 2000;
    return this.httpClient
      .post<LoginResponse>(`${BASE_URL}/auth/token/login/`, {
        email,
        password,
      })
      .pipe(
        timeout(timeoutMillis),
        concatMap(response => this.setToken(response.auth_token)),
        concatMapTo(this.readUser$()),
        concatMap(response =>
          forkJoin([
            this.setUsername(response.username),
            this.setEmail(response.email),
          ])
        ),
        map(([username, _email]) => ({ username, email: _email }))
      );
  }

  private readUser$() {
    return defer(() => this.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.get<ReadUserResponse>(`${BASE_URL}/auth/users/me/`, {
          headers,
        })
      )
    );
  }

  logout$() {
    return defer(() => this.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.post(`${BASE_URL}/auth/token/logout/`, {}, { headers })
      ),
      concatMapTo(
        defer(() =>
          Promise.all([
            this.setToken(''),
            this.setEmail(''),
            this.setUsername(''),
          ])
        )
      )
    );
  }

  createUser$(username: string, email: string, password: string) {
    return this.httpClient.post<CreateUserResponse>(`${BASE_URL}/auth/users/`, {
      username,
      email,
      password,
    });
  }

  async hasLoggedIn() {
    const token = await this.preferences.getString(PrefKeys.TOKEN);
    return !!token;
  }

  async getUsername() {
    return this.preferences.getString(PrefKeys.USERNAME);
  }

  private async setUsername(value: string) {
    return this.preferences.setString(PrefKeys.USERNAME, value);
  }

  async getEmail() {
    return this.preferences.getString(PrefKeys.EMAIL);
  }

  private async setEmail(value: string) {
    return this.preferences.setString(PrefKeys.EMAIL, value);
  }

  async getAuthHeaders() {
    return { authorization: `token ${await this.getToken()}` };
  }

  private async getToken() {
    return new Promise<string>((resolve, reject) => {
      this.preferences.getString(PrefKeys.TOKEN).then(token => {
        if (token.length !== 0) {
          resolve(token);
        } else {
          reject(new Error('Cannot get DIA backend token which is empty.'));
        }
      });
    });
  }

  private async setToken(value: string) {
    return this.preferences.setString(PrefKeys.TOKEN, value);
  }
}

const enum PrefKeys {
  TOKEN = 'TOKEN',
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
}

interface LoginResult {
  readonly username: string;
  readonly email: string;
}

export interface LoginResponse {
  readonly auth_token: string;
}

export interface ReadUserResponse {
  readonly username: string;
  readonly email: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateUserResponse {}
