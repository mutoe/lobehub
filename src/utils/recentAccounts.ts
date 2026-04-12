const STORAGE_KEY = 'lobehub:recent-accounts:v1';
const MAX_ACCOUNTS = 5;

export interface RecentAccount {
  avatar?: string;
  displayName?: string;
  email: string;
}

export const getRecentAccounts = (): RecentAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentAccount[];
  } catch {
    return [];
  }
};

export const saveRecentAccount = (account: RecentAccount): void => {
  if (!account.email) return;
  try {
    const accounts = getRecentAccounts().filter((a) => a.email !== account.email);
    accounts.unshift(account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
  } catch {
    // Ignore localStorage errors
  }
};

export const removeRecentAccount = (email: string): void => {
  try {
    const accounts = getRecentAccounts().filter((a) => a.email !== email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore localStorage errors
  }
};
