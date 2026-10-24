import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, Page, Post, Workspace, Conversation } from './api';
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
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
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
  it('ignores an old workspace response after switching to another workspace', async () => {
    let first!: (value: Workspace) => void;
    let second!: (value: Workspace) => void;
    call.and.returnValues(
      new Promise<Workspace>((resolve) => (first = resolve)),
      new Promise<Workspace>((resolve) => (second = resolve)),
    );
    spyOn(component, 'loadSection').and.resolveTo();
    const a = component.loadWorkspace(1);
    const b = component.loadWorkspace(2);
    second({ id: 2, name: 'Current', spaces: [] } as unknown as Workspace);
    await b;
    first({ id: 1, name: 'Previous', spaces: [] } as unknown as Workspace);
    await a;
    expect(component.ws?.id).toBe(2);
    expect(component.workspaceId).toBe(2);
  });
  it('does not append earlier messages from a previously selected conversation', async () => {
    let finish!: (value: any) => void;
    call.and.returnValues(
      new Promise((resolve) => (finish = resolve)),
      Promise.resolve({
        items: [{ id: 20, body: 'New conversation' }],
        hasMore: false,
      }),
    );
    component.selectedConversation = { id: 1 } as Conversation;
    component.messageCursor = 10;
    const previous = component.olderMessages();
    await component.openConversation({ id: 2 } as Conversation);
    finish({ items: [{ id: 1, body: 'Old conversation' }], hasMore: false });
    await previous;
    expect(component.messages.map((message) => message.id)).toEqual([20]);
  });
  it('keeps a new draft when an earlier message finishes sending', async () => {
    let finish!: () => void;
    call.and.returnValue(new Promise<void>((resolve) => (finish = resolve)));
    spyOn(component, 'pollMessages').and.resolveTo();
    component.selectedConversation = { id: 1 } as Conversation;
    component.messageText = 'First message';
    const sending = component.sendMessage();
    component.messageText = 'Next message';
    finish();
    await sending;
    expect(component.messageText).toBe('Next message');
  });
  it('clears private views and returns to login when a protected request expires',async()=>{
    (component.api as any).user=()=>null;
    const navigate=jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    (component.router as any).navigateByUrl=navigate;
    component.posts=[{id:1,body:'Private'} as Post];
    await component.action(async()=>{throw Error('Please sign in to continue.');});
    expect(component.posts).toEqual([]);expect(component.ws).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
