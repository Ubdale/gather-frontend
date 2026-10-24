import { ChangeDetectionStrategy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from './api';
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `<div class="recovery-page">
    <a class="wordmark" [routerLink]="api.user() ? '/gather/feed' : '/'"
      ><img src="assets/gather-mark.svg" alt="" />Gather</a
    >
    <section class="panel">
      <span class="eyebrow">A FRESH START</span>
      <h1>Set your new password.</h1>
      <p>
        This private recovery link was issued by your workspace operator after
        verifying your identity.
      </p>
      @if (error) {
        <div class="error" role="alert">{{ error }}</div>
      }
      @if (done) {
        <div class="notice" role="status">
          Your password has been changed. All previous sessions are signed out.
        </div>
        <a class="button" routerLink="/login">Sign in ↗</a>
      } @else {
        <form (ngSubmit)="submit()">
          <label
            >New password<input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              minlength="10"
              maxlength="128"
              autocomplete="new-password" /></label
          ><label
            >Confirm new password<input
              type="password"
              [(ngModel)]="confirmation"
              name="confirmation"
              required
              minlength="10"
              maxlength="128"
              autocomplete="new-password" /></label
          ><button class="button" type="submit" [disabled]="busy">
            {{ busy ? 'Saving…' : 'Set new password' }}
          </button>
        </form>
      }
    </section>
  </div>`,
})
export class RecoveryComponent {
  api = inject(Api);
  route = inject(ActivatedRoute);
  password = '';
  confirmation = '';
  busy = false;
  error = '';
  done = false;
  async submit() {
    if (this.busy || this.done) return;
    this.error = '';
    if (this.password !== this.confirmation) {
      this.error = 'The passwords do not match.';
      return;
    }
    this.busy = true;
    try {
      await this.api.call('auth/recover', 'POST', {
        token: this.route.snapshot.queryParamMap.get('token') || '',
        password: this.password,
      });
      this.password = '';
      this.confirmation = '';
      this.done = true;
      this.api.user.set(null);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.busy = false;
    }
  }
}
