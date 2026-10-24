import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { Api } from './api';

describe('Signed-in navigation', () => {
  let api: any;
  beforeEach(() => {
    const owner = { id: 1, name: 'QC Owner', email: 'qc@example.test' };
    const workspace = {
      id: 1,
      name: 'QC Community',
      tagline: 'QC',
      accent: '#247461',
      role: 'owner',
      plan: 'trial',
      limits: { members: 10, spaces: 3 },
      spaces: [{ id: 1, name: 'General', archived: 0 }],
      members: [],
      counts: { members: 1, posts: 0, reports: 0 },
    };
    api = {
      user: signal(owner),
      me: jasmine.createSpy('me').and.resolveTo(owner),
      call: jasmine.createSpy('call').and.callFake(async (path: string) => {
        if (path === 'workspaces')
          return [{ id: 1, name: 'QC Community', role: 'owner' }];
        if (path === 'workspaces/1') return workspace;
        if (path === 'plans') return { plans: {} };
        if (path.endsWith('/conversations')) return [];
        return { items: [], hasMore: false };
      }),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: Api, useValue: api }],
    });
  });
  it('returns from messages to the community feed when the logo is clicked without logging out', fakeAsync(() => {
    let harness!: RouterTestingHarness;
    RouterTestingHarness.create('/gather/messages').then(
      (value) => (harness = value),
    );
    flushMicrotasks();
    harness.fixture.detectChanges();
    const logo = harness.routeNativeElement!.querySelector(
      'a.wordmark',
    ) as HTMLAnchorElement;
    expect(logo.getAttribute('href')).toBe('/gather/feed');
    logo.click();
    flushMicrotasks();
    harness.fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/gather/feed');
    expect(api.user()?.id).toBe(1);
    expect(
      api.call.calls.allArgs().some((args: any[]) => args[0] === 'auth/logout'),
    ).toBeFalse();
    harness.fixture.destroy();
  }));
  it('shows an open-workspace action instead of sign-in on the public homepage', fakeAsync(() => {
    let harness!: RouterTestingHarness;
    RouterTestingHarness.create('/').then((value) => (harness = value));
    flushMicrotasks();
    harness.fixture.detectChanges();
    const nav = harness.routeNativeElement!.querySelector('nav')!;
    expect(nav.textContent).toContain('Open your workspace');
    expect(nav.querySelector('a[href="/login"]')).toBeNull();
    harness.fixture.destroy();
  }));
  it('redirects an already authenticated visitor away from the login form', fakeAsync(() => {
    let harness!: RouterTestingHarness;
    RouterTestingHarness.create('/login').then((value) => (harness = value));
    flushMicrotasks();
    expect(TestBed.inject(Router).url).toBe('/gather/feed');
    harness.fixture.destroy();
  }));
});
