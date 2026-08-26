export const CLIENT_TIMEOUT_MS = 90_000;

interface ClientTimeoutSignal {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
}

export function createClientTimeoutSignal(
  parentSignal?: AbortSignal,
  timeoutMs = CLIENT_TIMEOUT_MS,
): ClientTimeoutSignal {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener('abort', abortFromParent, { once: true });

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Client request timed out', 'TimeoutError'));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
  };
}
