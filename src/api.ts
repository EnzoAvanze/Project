export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    // A proxy or web server may return HTML. A malformed response is not a confirmed action.
    throw new ApiError(
      "O servidor retornou uma resposta inválida. Tente atualizar o aplicativo.",
      response.status || 502,
    );
  }
  if (!response.ok)
    throw new ApiError(
      result.error || "Não foi possível concluir.",
      response.status,
    );
  return result;
}
// Only explicit, confirmed actions are queued; no API responses or credentials are cached.
export interface Queued {
  id: string;
  owner: string;
  patient: string;
  path: string;
  body: Record<string, unknown>;
  label: string;
  error?: string;
}
const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("cuidali-outbox", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("actions", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
async function queueStore<T>(
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("actions", mode);
      const req = op(tx.objectStore("actions"));
      let result: T;
      req.onsuccess = () => {
        result = req.result;
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export const outbox = {
  all: () => queueStore<Queued[]>("readonly", (s) => s.getAll()),
  put: (x: Queued) => queueStore("readwrite", (s) => s.put(x)),
  remove: (id: string) => queueStore("readwrite", (s) => s.delete(id)),
  clearOwner: async (owner: string) => {
    const actions = await queueStore<Queued[]>("readonly", (s) => s.getAll());
    for (const action of actions.filter((a) => a.owner === owner)) {
      await queueStore("readwrite", (s) => s.delete(action.id));
    }
  },
};
