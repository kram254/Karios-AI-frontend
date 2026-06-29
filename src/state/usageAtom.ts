import { atom } from 'jotai';

export interface UsageState {
  tokens: number;
  costUsd: number;
  isLive: boolean;
}

export const usageAtom = atom<UsageState>({
  tokens: 0,
  costUsd: 0,
  isLive: false,
});
