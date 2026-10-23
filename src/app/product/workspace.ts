import { ChangeDetectionStrategy } from '@angular/core';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import {
  Api,
  Workspace,
  Post,
  Page,
  Conversation,
  Message,
  Member,
} from './api';
interface Moderation {
  posts: Post[];
  reports: {
    id: number;
    post_id: number;
    body: string;
    reporter: string;
    reason: string;
    status: string;
    created: string;
  }[];
}
interface Invitation {
  email: string;
  role: string;
  expires: number;
}
interface Audit {
  id: number;
  actor: string;
  action: string;
  created: string;
}
interface Billing {
  plan: string;
  requests: {
    id: number;
    plan: string;
    note: string;
    status: string;
    created: string;
  }[];
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './workspace.html',
})
export class WorkspaceComponent implements OnInit {
  api = inject(Api);
  router = inject(Router);
  route = inject(ActivatedRoute);
  destroyRef = inject(DestroyRef);
  @ViewChild('messageList') messageList?: ElementRef<HTMLElement>;
  ws: Workspace | null = null;
  workspaces: { id: number; name: string; accent: string; role: string }[] = [];
  workspaceId = 0;
  section = 'feed';
  loading = true;
  busy = false;
  error = '';
  notice = '';
  posts: Post[] = [];
  hasMore = false;
  cursor?: number;
  search = '';
  selectedSpace = 0;
  composer = '';
  composerSpace = 0;
  commentDrafts: Record<number, string | undefined> = {};
  editPost: Post | null = null;
  editText = '';
  reportPost: Post | null = null;
  reportReason = '';
  confirmDelete: Post | null = null;
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  messageMore = false;
  messageCursor?: number;
  chatSearch = '';
  chatFilter = 'All';
  messageText = '';
  mobileThread = false;
  showPeople = false;
  showEmoji = false;
  adminTab = 'Overview';
  moderation: Moderation = { posts: [], reports: [] };
  audit: Audit[] = [];
  invitations: Invitation[] = [];
  billing: Billing = { plan: 'trial', requests: [] };
  memberSearch = '';
  inviteEmail = '';
  inviteRole = 'member';
  inviteUrl = '';
  spaceName = '';
  spaceDescription = '';
  brandName = '';
  brandTagline = '';
  brandAccent = '#247461';
  requestedPlan = 'starter';
  planNote = '';
  profileName = '';
  currentPassword = '';
  newPassword = '';
  newWorkspaceName = '';
  showNewWorkspace = false;
  private feedSequence = 0;
  private chatSequence = 0;
  private conversationSequence = 0;
  private polling = false;
  private destroyed = false;
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }
  get canAdmin() {
    return !!this.ws && ['owner', 'admin'].includes(this.ws.role);
  }
  get canModerate() {
    return !!this.ws && ['owner', 'admin', 'moderator'].includes(this.ws.role);
  }
  get isOwner() {
    return this.ws?.role === 'owner';
  }
  get selectedSpaceName() {
    return (
      this.ws?.spaces.find((s) => s.id === this.selectedSpace)?.name ||
      'All spaces'
    );
  }
  get activeSpaces() {
    return this.ws?.spaces.filter((s) => !s.archived) || [];
  }
  get filteredMembers() {
    return (
      this.ws?.members.filter((m) =>
        (m.name + ' ' + (m.email || ''))
          .toLowerCase()
          .includes(this.memberSearch.toLowerCase()),
      ) || []
    );
  }
  get people() {
    return (
      this.ws?.members.filter(
        (m) => m.id !== this.api.user()?.id && m.status === 'active',
      ) || []
    );
  }
  get visibleConversations() {
    return this.conversations.filter(
      (c) =>
        c.people.some((p) =>
          p.name.toLowerCase().includes(this.chatSearch.toLowerCase()),
        ) &&
        (this.chatFilter !== 'Unread' || c.unread > 0) &&
        (this.chatFilter !== 'Starred' || c.starred),
    );
  }
  get adminTabs() {
    return this.canAdmin
      ? [
          'Overview',
          'Members',
          'Spaces',
          'Moderation',
          'Branding',
          'Plans',
          'Activity',
        ]
      : ['Overview', 'Moderation'];
  }
  get title() {
    return (
      (
        {
          feed: 'Community feed',
          saved: 'Saved posts',
          messages: 'Messages',
          profile: 'Your profile',
          admin: 'Admin studio',
        } as Record<string, string>
      )[this.section] || 'Community feed'
    );
  }
  initials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase();
  }
  time(value: string) {
    return new Date(
      value.includes('T') ? value : value.replace(' ', 'T') + 'Z',
    );
  }
  async ngOnInit() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.section = data['section'] || 'feed';
        this.search = '';
        this.notice = '';
        if (this.ws) void this.loadSection();
      });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.selectedSpace = Number(params.get('space')) || 0;
        if (params.get('tab') === 'Plans') this.adminTab = 'Plans';
        if (this.ws) void this.loadSection();
      });
    try {
      await this.api.me();
      this.profileName = this.api.user()?.name || '';
      await this.refreshWorkspaces();
      await this.loadWorkspace(this.workspaceId);
    } catch (e) {
      if (!this.api.user()) {
        await this.router.navigateByUrl('/login');
      } else this.error = (e as Error).message;
    } finally {
      this.loading = false;
    }
    interval(4000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (
          !this.ws ||
          this.polling ||
          this.busy ||
          this.destroyed ||
          this.section !== 'messages'
        )
          return;
        this.polling = true;
        void this.pollMessages().finally(() => (this.polling = false));
      });
  }
  async refreshWorkspaces() {
    this.workspaces = await this.api.call('workspaces');
    let preferred = 0;
    try {
      preferred = Number(localStorage.getItem('gather-active-workspace'));
    } catch {}
    this.workspaceId =
      this.workspaces.find((w) => w.id === preferred)?.id ||
      this.workspaces[0]?.id ||
      0;
  }
  path(part = '') {
    return `workspaces/${this.workspaceId}${part ? '/' + part : ''}`;
  }
  async action(work: () => Promise<unknown>, message = '') {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await work();
      if (message) this.notice = message;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.busy = false;
    }
  }
  async loadWorkspace(id: number) {
    this.loading = true;
    this.error = '';
    this.feedSequence++;
    this.chatSequence++;
    this.conversationSequence++;
    this.workspaceId = id;
    this.posts = [];
    this.messages = [];
    this.selectedConversation = null;
    this.conversations = [];
    this.inviteUrl = '';
    this.selectedSpace =
      Number(this.route.snapshot.queryParamMap.get('space')) || 0;
    try {
      if (!id) {
        this.ws = null;
        return;
      }
      this.ws = await this.api.call<Workspace>(this.path());
      try {
        localStorage.setItem('gather-active-workspace', String(id));
      } catch {}
      this.brandName = this.ws.name;
      this.brandTagline = this.ws.tagline;
      this.brandAccent = this.ws.accent;
      this.composerSpace = this.activeSpaces[0]?.id || 0;
      this.composer = '';
      await this.loadSection();
    } catch (e) {
      this.error = (e as Error).message;
      this.ws = null;
    } finally {
      this.loading = false;
    }
  }
  async reload() {
    await this.action(async () => {
      await this.refreshWorkspaces();
      await this.loadWorkspace(this.workspaceId);
    });
  }
  async loadSection() {
    try {
      if (this.section === 'admin' && !this.canModerate) {
        await this.router.navigateByUrl('/gather/feed');
        return;
      }
      if (['feed', 'saved', 'profile'].includes(this.section))
        await this.loadPosts();
      if (this.section === 'messages') await this.loadConversations();
      if (this.section === 'admin') await this.loadAdmin();
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
  async loadPosts(more = false) {
    const sequence = ++this.feedSequence;
    const params = new URLSearchParams();
    if (this.section === 'saved') params.set('saved', 'true');
    if (this.section === 'profile') params.set('mine', 'true');
    if (this.selectedSpace && this.section === 'feed')
      params.set('space', String(this.selectedSpace));
    if (this.search) params.set('search', this.search);
    if (more && this.cursor) params.set('before', String(this.cursor));
    const result = await this.api.call<Page<Post>>(
      this.path('posts') + '?' + params,
    );
    if (sequence !== this.feedSequence || this.destroyed) return;
    this.posts = more ? [...this.posts, ...result.items] : result.items;
    this.hasMore = result.hasMore;
    this.cursor = result.nextCursor;
  }
  async loadMorePosts() {
    await this.action(() => this.loadPosts(true));
  }
  async searchPosts() {
    await this.action(() => this.loadPosts());
  }
  async selectSpace(id: number) {
    this.selectedSpace = id;
    this.composerSpace = id || this.activeSpaces[0]?.id || 0;
    await this.router.navigate(['/gather/feed'], {
      queryParams: id ? { space: id } : {},
    });
  }
  async publish() {
    if (!this.composer.trim()) return;
    await this.action(async () => {
      await this.api.call(this.path('posts'), 'POST', {
        body: this.composer,
        spaceId: Number(this.composerSpace),
      });
      this.composer = '';
      this.ws = await this.api.call(this.path());
      await this.loadPosts();
    }, 'Your post is published.');
  }
  async togglePost(post: Post, kind: 'reaction' | 'bookmark') {
    await this.action(async () => {
      const response = await this.api.call<{ active: boolean }>(
        this.path(`posts/${post.id}/${kind}`),
        'POST',
      );
      if (kind === 'reaction') {
        post.likes += response.active ? 1 : -1;
        post.liked = Number(response.active);
      } else {
        post.saved = Number(response.active);
        if (this.section === 'saved' && !response.active)
          this.posts = this.posts.filter((p) => p.id !== post.id);
      }
    });
  }
  async addComment(post: Post) {
    const body = this.commentDrafts[post.id]?.trim();
    if (!body) return;
    await this.action(async () => {
      await this.api.call(this.path(`posts/${post.id}/comments`), 'POST', {
        body,
      });
      this.commentDrafts[post.id] = '';
      await this.loadPosts();
    });
  }
  async olderComments(post: Post) {
    await this.action(async () => {
      const page = await this.api.call<Page<import('./api').Comment>>(
        this.path('posts/' + post.id + '/comments') +
          '?before=' +
          post.comments[0].id,
      );
      post.comments = [...page.items, ...post.comments];
    });
  }
  async exportData() {
    await this.action(async () => {
      const data = await this.api.call('auth/export');
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'gather-personal-data.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'Your data export has been downloaded.');
  }
  async deleteComment(post: Post, id: number) {
    await this.action(async () => {
      await this.api.call(this.path(`comments/${id}`), 'DELETE');
      post.comments = post.comments.filter((c) => c.id !== id);
      post.comment_count--;
    });
  }
  beginEdit(post: Post) {
    this.editPost = post;
    this.editText = post.body;
  }
  async savePost() {
    if (!this.editPost) return;
    await this.action(async () => {
      await this.api.call(this.path(`posts/${this.editPost!.id}`), 'PATCH', {
        body: this.editText,
      });
      this.editPost = null;
      await this.loadPosts();
    }, 'Post updated.');
  }
  async deletePost() {
    if (!this.confirmDelete) return;
    await this.action(async () => {
      await this.api.call(
        this.path(`posts/${this.confirmDelete!.id}`),
        'DELETE',
      );
      this.confirmDelete = null;
      await this.loadPosts();
      this.ws = await this.api.call(this.path());
    }, 'Post deleted.');
  }
  async report() {
    if (!this.reportPost) return;
    await this.action(async () => {
      await this.api.call(
        this.path(`posts/${this.reportPost!.id}/report`),
        'POST',
        { reason: this.reportReason },
      );
      this.reportPost = null;
      this.reportReason = '';
    }, 'Report sent to your workspace moderators.');
  }
  async loadConversations() {
    const workspace = this.workspaceId;
    const sequence = ++this.conversationSequence;
    const conversations = await this.api.call<Conversation[]>(
      this.path('conversations'),
    );
    if (
      workspace !== this.workspaceId ||
      sequence !== this.conversationSequence ||
      this.destroyed
    )
      return;
    this.conversations = conversations;
    if (this.selectedConversation)
      this.selectedConversation =
        this.conversations.find(
          (c) => c.id === this.selectedConversation!.id,
        ) || null;
  }
  async pollMessages() {
    const workspace = this.workspaceId;
    try {
      await this.loadConversations();
      const conversation = this.selectedConversation?.id;
      if (conversation) {
        const sequence = this.chatSequence;
        const page = await this.api.call<Page<Message>>(
          this.path(`conversations/${conversation}/messages`),
        );
        if (
          this.workspaceId !== workspace ||
          sequence !== this.chatSequence ||
          this.destroyed
        )
          return;
        const newest = this.messages.at(-1)?.id;
        const byId = new Map(this.messages.map((m) => [m.id, m]));
        page.items.forEach((m) => byId.set(m.id, m));
        this.messages = [...byId.values()].sort((a, b) => a.id - b.id);
        if (newest !== this.messages.at(-1)?.id) this.scrollMessages();
      }
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
  async openConversation(conversation: Conversation) {
    const sequence = ++this.chatSequence;
    this.selectedConversation = conversation;
    this.mobileThread = true;
    this.messageText = '';
    this.messages = [];
    this.error = '';
    try {
      const page = await this.api.call<Page<Message>>(
        this.path(`conversations/${conversation.id}/messages`),
      );
      if (sequence !== this.chatSequence || this.destroyed) return;
      this.messages = page.items;
      this.messageMore = page.hasMore;
      this.messageCursor = page.nextCursor;
      conversation.unread = 0;
      this.scrollMessages();
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
  async olderMessages() {
    if (!this.selectedConversation || !this.messageCursor) return;
    await this.action(async () => {
      const page = await this.api.call<Page<Message>>(
        this.path(`conversations/${this.selectedConversation!.id}/messages`) +
          `?before=${this.messageCursor}`,
      );
      this.messages = [...page.items, ...this.messages];
      this.messageMore = page.hasMore;
      this.messageCursor = page.nextCursor;
    });
  }
  async startConversation(member: Member) {
    await this.action(async () => {
      const { id } = await this.api.call<{ id: number }>(
        this.path('conversations'),
        'POST',
        { userId: member.id },
      );
      this.showPeople = false;
      this.chatFilter = 'All';
      this.chatSearch = '';
      await this.loadConversations();
      await this.openConversation(this.conversations.find((c) => c.id === id)!);
    });
  }
  async sendMessage() {
    if (!this.selectedConversation || !this.messageText.trim()) return;
    await this.action(async () => {
      await this.api.call(
        this.path(`conversations/${this.selectedConversation!.id}/messages`),
        'POST',
        { body: this.messageText },
      );
      this.messageText = '';
      this.showEmoji = false;
      await this.pollMessages();
    });
  }
  async starConversation() {
    if (!this.selectedConversation) return;
    await this.action(async () => {
      await this.api.call(
        this.path(`conversations/${this.selectedConversation!.id}`),
        'PATCH',
        { starred: !this.selectedConversation!.starred },
      );
      await this.loadConversations();
    });
  }
  scrollMessages() {
    setTimeout(() => {
      const node = this.messageList?.nativeElement;
      if (node) node.scrollTop = node.scrollHeight;
    });
  }
  async selectAdmin(tab: string) {
    this.adminTab = tab;
    this.error = '';
    this.notice = '';
    await this.action(() => this.loadAdmin());
  }
  async loadAdmin() {
    if (!this.ws) return;
    this.ws = await this.api.call(this.path());
    if (this.adminTab === 'Moderation')
      this.moderation = await this.api.call(this.path('moderation'));
    if (this.adminTab === 'Activity')
      this.audit = await this.api.call(this.path('audit'));
    if (this.adminTab === 'Members')
      this.invitations = await this.api.call(this.path('invitations'));
    if (this.adminTab === 'Plans')
      this.billing = await this.api.call(this.path('billing'));
  }
  async invite() {
    await this.action(async () => {
      const invite = await this.api.call<{ url: string }>(
        this.path('invitations'),
        'POST',
        { email: this.inviteEmail, role: this.inviteRole },
      );
      this.inviteUrl = invite.url;
      this.inviteEmail = '';
      await this.loadAdmin();
    }, 'Invitation created. Share the link privately with the intended recipient.');
  }
  async copyInvite() {
    try {
      await navigator.clipboard.writeText(this.inviteUrl);
      this.notice = 'Invitation link copied.';
    } catch {
      this.notice =
        'Clipboard is unavailable. Select and copy the invitation link below.';
    }
  }
  async revokeInvite(email: string) {
    await this.action(async () => {
      await this.api.call(this.path('invitations'), 'DELETE', { email });
      await this.loadAdmin();
    }, 'Invitation revoked.');
  }
  async saveMember(member: Member) {
    await this.action(async () => {
      await this.api.call(this.path(`members/${member.id}`), 'PATCH', {
        role: member.role,
        status: member.status,
      });
      await this.loadAdmin();
    }, 'Member permissions saved.');
  }
  async createSpace() {
    await this.action(async () => {
      await this.api.call(this.path('spaces'), 'POST', {
        name: this.spaceName,
        description: this.spaceDescription,
      });
      this.spaceName = '';
      this.spaceDescription = '';
      await this.loadAdmin();
    }, 'Space created.');
  }
  async archiveSpace(id: number, archived: boolean) {
    await this.action(
      async () => {
        await this.api.call(this.path(`spaces/${id}`), 'PATCH', { archived });
        await this.loadAdmin();
      },
      archived ? 'Space archived. Existing posts are kept.' : 'Space restored.',
    );
  }
  async moderate(post: Post) {
    await this.action(async () => {
      await this.api.call(this.path(`moderation/${post.id}`), 'PATCH', {
        hidden: !post.hidden,
      });
      await this.loadAdmin();
    }, 'Post visibility updated.');
  }
  async resolveReport(id: number) {
    await this.action(async () => {
      await this.api.call(this.path(`reports/${id}`), 'PATCH');
      await this.loadAdmin();
    }, 'Report marked as resolved.');
  }
  async saveBrand() {
    await this.action(async () => {
      await this.api.call(this.path(), 'PATCH', {
        name: this.brandName,
        tagline: this.brandTagline,
        accent: this.brandAccent,
      });
      this.ws = await this.api.call(this.path());
      await this.refreshWorkspaces();
    }, 'Workspace branding published.');
  }
  async requestPlan() {
    await this.action(async () => {
      const result = await this.api.call<{ message: string }>(
        this.path('billing'),
        'POST',
        { plan: this.requestedPlan, note: this.planNote },
      );
      this.planNote = '';
      await this.loadAdmin();
      this.notice = result.message;
    });
  }
  async createWorkspace() {
    await this.action(async () => {
      const result = await this.api.call<{ id: number }>('workspaces', 'POST', {
        name: this.newWorkspaceName,
      });
      this.newWorkspaceName = '';
      this.showNewWorkspace = false;
      await this.refreshWorkspaces();
      await this.loadWorkspace(result.id);
    }, 'New workspace created.');
  }
  async saveProfile() {
    await this.action(async () => {
      const user = await this.api.call<NonNullable<ReturnType<Api['user']>>>(
        'auth/profile',
        'POST',
        { name: this.profileName },
      );
      this.api.user.set(user);
      this.ws = await this.api.call(this.path());
    }, 'Your name is updated.');
  }
  async changePassword() {
    await this.action(async () => {
      await this.api.call('auth/password', 'POST', {
        current: this.currentPassword,
        password: this.newPassword,
      });
      this.currentPassword = '';
      this.newPassword = '';
    }, 'Password changed. Other sessions have been signed out.');
  }
  async logout() {
    await this.action(async () => {
      await this.api.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
