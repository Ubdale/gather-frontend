import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, Page, Post } from './api';
import { WorkspaceComponent } from './workspace';
describe('Workspace asynchronous state', () => {
  let component: WorkspaceComponent;
  let call: jasmine.Spy;
  beforeEach(() => {
    call = jasmine.createSpy('call');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Api,
          useValue: {
            call,
            user: () => ({
              id: 1,
              name: 'Member',
              email: 'member@example.test',
            }),
          },
        },
        { provide: Router, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new WorkspaceComponent());
    component.workspaceId = 1;
  });
  it('ignores a stale search response that arrives after a newer search', async () => {
    let first!: (value: Page<Post>) => void;
    let second!: (value: Page<Post>) => void;
    call.and.returnValues(
      new Promise<Page<Post>>((resolve) => (first = resolve)),
      new Promise<Page<Post>>((resolve) => (second = resolve)),
    );
    component.search = 'old';
    const a = component.loadPosts();
    component.search = 'new';
    const b = component.loadPosts();
    second({ items: [{ id: 2, body: 'New result' } as Post], hasMore: false });
    await b;
    first({ items: [{ id: 1, body: 'Old result' } as Post], hasMore: false });
    await a;
    expect(component.posts[0].id).toBe(2);
  });
  it('prevents duplicate mutations while an action is in progress and exposes failures', async () => {
    let finish!: () => void;
    let runs = 0;
    const pending = component.action(
      () =>
        new Promise<void>((resolve) => {
          runs++;
          finish = resolve;
        }),
    );
    await component.action(async () => {
      runs++;
    });
    expect(runs).toBe(1);
    finish();
    await pending;
    await component.action(async () => {
      throw Error('Request denied');
    });
    expect(component.error).toBe('Request denied');
    expect(component.busy).toBeFalse();
  });
});
