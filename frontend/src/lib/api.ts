export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection.");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.message ?? (res.status >= 500 ? "Server error, please try again" : "Something went wrong");
    throw new ApiError(res.status, message, body.errors);
  }
  return body as T;
}

/** Copies server field errors (`{ field: [msg] }`) onto a react-hook-form instance. */
export function applyServerErrors<F extends string>(
  error: ApiError,
  setError: (field: F, e: { type: string; message: string }) => void,
  fields: readonly F[],
) {
  let applied = false;
  for (const [field, messages] of Object.entries(error.errors ?? {})) {
    if (messages?.length && (fields as readonly string[]).includes(field)) {
      setError(field as F, { type: "server", message: messages[0]! });
      applied = true;
    }
  }
  return applied;
}
