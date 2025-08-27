// Skeleton for future integration (no real requests yet)

export interface ModelInput {
  file: File;
  metadata?: Record<string, string>;
}

export interface ModelJob {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export async function createJob(_input: ModelInput): Promise<ModelJob> {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 300));
  return { id: crypto.randomUUID(), status: 'queued' };
}

export async function getJobStatus(_id: string): Promise<ModelJob> {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 300));
  return { id: _id, status: 'processing' };
}
