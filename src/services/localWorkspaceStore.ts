import { createSeedWorkspace, type WorkspaceSnapshot } from '@/data/seedData';

const STORAGE_KEY = 'taskforge.workspace.v1';

function isSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<WorkspaceSnapshot>;
  return (
    Array.isArray(candidate.agents) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.transactions) &&
    typeof candidate.settings === 'object' &&
    candidate.settings !== null
  );
}

export function readStoredWorkspace(): WorkspaceSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isSnapshot(parsed)) return parsed;
    }
  } catch {
    return createSeedWorkspace();
  }
  return createSeedWorkspace();
}

export function writeStoredWorkspace(snapshot: WorkspaceSnapshot): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    throw new Error('Your changes could not be saved in this browser.');
  }
}
