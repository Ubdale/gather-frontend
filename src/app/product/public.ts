import { ChangeDetectionStrategy } from '@angular/core';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Api, User, Plan } from './api';
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RouterLink],
  template: ` <div class="landing">
    <header class="public-header">
      <a class="wordmark" [routerLink]="api.user() ? '/gather/feed' : '/'"
        ><img src="assets/gather-mark.svg" alt="" />Gather</a
      >
      <nav>
        <a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a>
        @if (api.user()) {
          <a class="button" routerLink="/gather/feed">Open your workspace ↗</a>
        } @else {
          <a routerLink="/login">Sign in</a
          ><a class="button" routerLink="/register"
            >Create your community <span>↗</span></a
          >
        }
      </nav>
    </header>
    <main>
      <section class="landing-hero">
        <span class="eyebrow">YOUR PEOPLE. YOUR PLACE.</span>
        <h1>Good conversations.<br /><em>Great communities.</em></h1>
        <p>
          A private home for your customers, members, and ideas.<br />Bring your
          social feed and everyday conversations together.
        </p>
        <div class="hero-actions">
          <a
            class="button"
            [routerLink]="api.user() ? '/gather/feed' : '/register'"
            >{{ api.user() ? 'Open your workspace' : 'Start your free pilot' }}
            <span>↗</span></a
          ><a href="#pricing">Explore the plans ↓</a>
        </div>
        <small>10 members · 3 spaces · No card required</small>
        <div
          class="hero-illustration"
          aria-label="Gather brings posts, conversations, and community administration together"
        >
          <div>
            <span class="material-symbols-outlined">forum</span
            ><strong>A little hello</strong>
            <p>Becomes a meaningful conversation.</p>
          </div>
          <div>
            <span class="material-symbols-outlined">diversity_2</span
            ><strong>A shared space</strong>
            <p>Becomes a place to belong.</p>
          </div>
          <div>
            <span class="material-symbols-outlined">auto_awesome</span
            ><strong>A new idea</strong>
            <p>Becomes something worth building.</p>
          </div>
        </div>
      </section>
      <section id="how-it-works" class="landing-section">
        <span class="eyebrow">SMALL START. REAL CONNECTIONS.</span>
        <h2>Everything your community needs to get going.</h2>
        <div class="feature-grid">
          <article>
            <span class="material-symbols-outlined">dynamic_feed</span>
            <h3>A shared community feed</h3>
            <p>
              Organize posts into spaces. Comment, react, save, and find the
              things that matter.
            </p>
          </article>
          <article>
            <span class="material-symbols-outlined">chat</span>
            <h3>Conversations that continue</h3>
            <p>
              Send private messages to workspace members, track unread messages,
              and star conversations.
            </p>
          </article>
          <article>
            <span class="material-symbols-outlined">admin_panel_settings</span>
            <h3>A thoughtful admin studio</h3>
            <p>
              Invite your people, set permissions, moderate content, and make
              the space your own.
            </p>
          </article>
        </div>
      </section>
      <section id="pricing" class="landing-section pricing-section">
        <span class="eyebrow">ROOM TO GROW</span>
        <h2>A workspace subscription. A clearer way to connect.</h2>
        <p class="section-copy">
          Pilot for free. Paid plans are activated after a separate invoice
          agreement. Prices in USD per workspace per month.
        </p>
        @if (error) {
          <p class="error" role="alert">{{ error }}</p>
          <button class="secondary" (click)="loadPlans()">
            Retry loading plans
          </button>
        }
        <div class="pricing-grid">
          @for (entry of planEntries; track entry.key) {
            <article
              class="price-card"
              [class.featured]="entry.key === 'starter'"
            >
              <span class="eyebrow">{{
                entry.key === 'starter'
                  ? 'FOR GROWING COMMUNITIES'
                  : entry.key === 'trial'
                    ? 'TRY IT WITH YOUR TEAM'
                    : 'MORE ROOM, SAME CONNECTION'
              }}</span>
              <h3>{{ entry.plan.name }}</h3>
              <div class="price">
                $ {{ entry.plan.price }}<small>/ month</small>
              </div>
              <ul>
                <li>{{ entry.plan.members }} members</li>
                <li>{{ entry.plan.spaces }} active spaces</li>
                <li>Feed, comments, and private messaging</li>
                <li>Moderation and workspace branding</li>
              </ul>
              <a class="button" routerLink="/register"
                >{{
                  entry.key === 'trial'
                    ? 'Start your free pilot'
                    : 'Start a pilot, then request this plan'
                }}
                ↗</a
              >
            </article>
          }
        </div>
        <p class="pricing-note">
          Agency setup and migration are quoted separately. Gather uses a
          browser-based workspace; native mobile apps, video calls, and media
          hosting are not included.
        </p>
      </section>
    </main>
    <footer class="public-footer">
      <a class="wordmark" [routerLink]="api.user() ? '/gather/feed' : '/'"
        ><img src="assets/gather-mark.svg" alt="" />Gather</a
      ><span>A place for your people.</span
      ><a [routerLink]="api.user() ? '/gather/feed' : '/login'">{{
        api.user() ? 'Open your workspace ↗' : 'Member sign in ↗'
      }}</a>
    </footer>
  </div>`,
})
export class LandingComponent implements OnInit {
  api = inject(Api);
  planEntries: { key: string; plan: Plan }[] = [];
  error = '';
  ngOnInit() {
    void this.api.me().catch(() => {});
    void this.loadPlans();
  }
  async loadPlans() {
    this.error = '';
    try {
      const data = await this.api.call<{ plans: Record<string, Plan> }>(
        'plans',
      );
      this.planEntries = Object.entries(data.plans).map(([key, plan]) => ({
        key,
        plan,
      }));
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: ` <div class="auth-page">
    <aside class="auth-story">
      <a class="wordmark" [routerLink]="api.user() ? '/gather/feed' : '/'"
        ><img src="assets/gather-mark.svg" alt="" />Gather</a
      >
      <div>
        <span class="eyebrow">MAKE ROOM FOR YOUR PEOPLE</span>
        <h1>A little closer.<br />Every day.</h1>
        <p>
          Your community, conversations, and ideas.<br />All in one welcoming
          place.
        </p>
        <span class="auth-flower" aria-hidden="true">✳</span>
      </div>
      <small>A private home for meaningful connections.</small>
    </aside>
    <main class="auth-main">
      <a class="back-link" routerLink="/">← Back to Gather</a>
      <section>
        <span class="eyebrow">{{
          invitation
            ? 'YOU HAVE A PLACE HERE'
            : register
              ? 'YOUR NEXT CHAPTER STARTS HERE'
              : 'GOOD TO SEE YOU AGAIN'
        }}</span>
        <h2>
          {{
            invitation
              ? 'Join your community'
              : register
                ? 'Create your workspace'
                : 'Welcome back.'
          }}
        </h2>
        <p>
          {{
            invitation
              ? 'Use the email address your invitation was sent to.'
              : register
                ? 'Start a free pilot with up to 10 members.'
                : 'Sign in to continue the conversation.'
          }}
        </p>
        @if (error) {
          <div class="error" role="alert">{{ error }}</div>
        }
        <form (ngSubmit)="submit()">
          @if (register) {
            <label
              >Your name<input
                [(ngModel)]="name"
                name="name"
                required
                maxlength="80"
                autocomplete="name"
            /></label>
            @if (!invitation) {
              <label
                >Community name<input
                  [(ngModel)]="workspaceName"
                  name="workspace"
                  required
                  maxlength="60"
                  autocomplete="organization"
              /></label>
            }
          }
          <label
            >Email address<input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              maxlength="150"
              autocomplete="email" /></label
          ><label
            >Password<input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              [minlength]="register ? 10 : 1"
              maxlength="128"
              [autocomplete]="register ? 'new-password' : 'current-password'"
          /></label>
          @if (register) {
            <small
              >Use at least 10 characters. Your password is securely hashed on
              the server.</small
            >
          }
          <button class="button full" type="submit" [disabled]="busy">
            {{
              busy
                ? 'Please wait…'
                : invitation
                  ? 'Join workspace'
                  : register
                    ? 'Create my workspace'
                    : 'Sign in'
            }}
            <span>↗</span>
          </button>
        </form>
        <p class="auth-switch">
          {{ register ? 'Already have an account?' : 'New to Gather?' }}
          <button (click)="toggle()">
            {{ register ? 'Sign in' : 'Create an account' }}
          </button>
        </p>
        @if (!register) {
          <small class="muted"
            >Need account recovery? Contact your workspace operator. Automated
            recovery email is not offered in this pilot.</small
          >
        }
      </section>
    </main>
  </div>`,
})
export class AuthComponent implements OnInit {
  api = inject(Api);
  router = inject(Router);
  route = inject(ActivatedRoute);
  register = false;
  invitation = '';
  name = '';
  email = '';
  password = '';
  workspaceName = '';
  busy = false;
  error = '';
  ngOnInit() {
    this.register = this.route.snapshot.routeConfig?.path !== 'login';
    this.invitation = this.route.snapshot.queryParamMap.get('token') || '';
    // Invitation links must remain usable by existing signed-in members.
    if (!this.invitation) {
      this.busy = true;
      void this.api
        .me()
        .then(() => this.router.navigateByUrl('/gather/feed'))
        .catch(() => {})
        .finally(() => (this.busy = false));
    }
  }
  toggle() {
    this.register = !this.register;
    this.error = '';
    this.password = '';
  }
  async submit() {
    if (this.busy) return;
    this.error = '';
    this.busy = true;
    try {
      const user = await this.api.call<User>(
        'auth/' + (this.register ? 'register' : 'login'),
        'POST',
        this.register
          ? {
              name: this.name,
              email: this.email,
              password: this.password,
              ...(this.invitation
                ? { invitation: this.invitation }
                : { workspaceName: this.workspaceName }),
            }
          : { email: this.email, password: this.password },
      );
      this.api.user.set(user);
      if (!this.register && this.invitation)
        await this.api.call('auth/accept-invitation', 'POST', {
          token: this.invitation,
        });
      this.password = '';
      await this.router.navigateByUrl('/gather/feed');
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.busy = false;
    }
  }
}
