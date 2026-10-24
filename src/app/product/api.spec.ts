import { Api } from './api';
describe('Gather API client', () => {
  let api: Api;
  let request: jasmine.Spy;
  beforeEach(() => {
    api = new Api();
    request = spyOn(window, 'fetch');
  });
  it('uses same-origin cookies without exposing a bearer token to the application', async () => {
    request.and.resolveTo(
      new Response(
        JSON.stringify({ id: 1, name: 'Member', email: 'member@example.test' }),
        { status: 200 },
      ),
    );
    await api.me();
    expect(request).toHaveBeenCalledWith(
      '/api/auth/me',
      jasmine.objectContaining({ credentials: 'same-origin' }),
    );
    expect(api.user()?.id).toBe(1);
  });
  it('clears expired identity and surfaces server errors', async () => {
    api.user.set({ id: 1, name: 'Member', email: 'member@example.test' });
    request.and.resolveTo(
      new Response(JSON.stringify({ message: 'Please sign in to continue.' }), {
        status: 401,
      }),
    );
    await expectAsync(api.call('workspaces')).toBeRejectedWithError(
      'Please sign in to continue.',
    );
    expect(api.user()).toBeNull();
  });
  it('turns a failed connection into an actionable message', async () => {
    request.and.rejectWith(new TypeError('Failed to fetch'));
    await expectAsync(api.call('health')).toBeRejectedWithError(
      'Cannot connect to Gather. Check your connection and try again.',
    );
  });
  it('does not clear an existing session identity because a separate sign-in attempt fails',async()=>{
    api.user.set({id:1,name:'Member',email:'member@example.test'});
    request.and.resolveTo(new Response(JSON.stringify({message:'Email or password is incorrect.'}),{status:401}));
    await expectAsync(api.call('auth/login','POST',{})).toBeRejectedWithError('Email or password is incorrect.');
    expect(api.user()?.id).toBe(1);
  });
});
