import { type SSOProvider } from '@lobechat/types';

import { clearActiveScopeKey } from '@/libs/swr/useCacheScope';
import { type StoreSetter } from '@/store/types';

import { type UserStore } from '../../store';

interface AuthProvidersData {
  hasPasswordAccount: boolean;
  providers: SSOProvider[];
}

const fetchAuthProvidersData = async (): Promise<AuthProvidersData> => {
  const { accountInfo, listAccounts } = await import('@/libs/better-auth/auth-client');
  const result = await listAccounts();
  const accounts = result.data || [];
  const hasPasswordAccount = accounts.some((account) => account.providerId === 'credential');
  const providers = await Promise.all(
    accounts
      .filter((account) => account.providerId !== 'credential')
      .map(async (account) => {
        // In theory, the id_token could be decrypted from the accounts table, but I found that better-auth on GitHub does not save the id_token
        const info = await accountInfo({
          query: { accountId: account.accountId },
        });
        return {
          email: info.data?.user?.email ?? undefined,
          provider: account.providerId,
          providerAccountId: account.accountId,
        };
      }),
  );
  return { hasPasswordAccount, providers };
};

type Setter = StoreSetter<UserStore>;
export const createAuthSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new UserAuthActionImpl(set, get, _api);

export class UserAuthActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  fetchAuthProviders = async (): Promise<void> => {
    // Skip if already loaded
    if (this.#get().isLoadedAuthProviders) return;

    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount, isLoadedAuthProviders: true });
    } catch (error) {
      console.error('Failed to fetch auth providers:', error);
      this.#set({ isLoadedAuthProviders: true });
    }
  };

  logout = async (): Promise<void> => {
    // Clear the OIDC Provider session for the current browser *before*
    // destroying the better-auth session. This prevents a stale OIDC session
    // from silently issuing tokens for the old account after the user signs
    // in as someone else.
    try {
      await fetch('/oidc/clear-session', { method: 'POST' });
    } catch {
      // Best-effort: don't block sign-out if the cleanup request fails
    }

    // With multiSession plugin enabled, signOut() revokes ALL device sessions for this
    // user — that defeats the quick-switch UX. Instead revoke only the *current* session
    // by token, leaving other accounts' cookies in the jar so /signin can list them.
    const { getSession, multiSession, signOut } = await import('@/libs/better-auth/auth-client');
    try {
      const session = await getSession();
      const token = session?.data?.session?.token;
      if (token) {
        await multiSession.revoke({ sessionToken: token });
        // Drop the persisted active scope so the next boot doesn't hydrate the
        // signed-out user's cache (localStorage survives the reload below).
        clearActiveScopeKey();
        // Full page reload — same intent as upstream signOut.onSuccess
        window.location.href = '/signin';
        return;
      }
    } catch {
      // Fall back to full signOut if revoke path fails
    }

    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Drop the persisted active scope so the next boot doesn't hydrate the
          // signed-out user's cache (localStorage survives the reload below).
          clearActiveScopeKey();
          // Use window.location.href to trigger a full page reload
          // This ensures all client-side state (React, Zustand, cache) is cleared
          window.location.href = '/signin';
        },
      },
    });
  };

  openLogin = async (): Promise<void> => {
    // Skip if already on a login page (/signin, /signup)
    const pathname = location.pathname;
    if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
      return;
    }

    const currentUrl = location.toString();
    window.location.href = `/signin?callbackUrl=${encodeURIComponent(currentUrl)}`;
  };

  refreshAuthProviders = async (): Promise<void> => {
    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount });
    } catch (error) {
      console.error('Failed to refresh auth providers:', error);
    }
  };
}

export type UserAuthAction = Pick<UserAuthActionImpl, keyof UserAuthActionImpl>;
