type Listener = () => void;

let unreachable = false;
const listeners = new Set<Listener>();

/** True after a cloud auth request failed because the host could not be reached. */
export function isCloudUnreachable(): boolean {
  return unreachable;
}

export function markCloudUnreachable(): void {
  if (unreachable) return;
  unreachable = true;
  for (const listener of listeners) listener();
}

export function onCloudReachabilityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isUnreachableAuthError(error: { name?: string; message?: string }): boolean {
  const name = error.name ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    name === "AuthRetryableFetchError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("err_name_not_resolved") ||
    message.includes("name not resolved")
  );
}
