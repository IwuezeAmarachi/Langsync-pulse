import type { PlatformExtractor } from "../extractors/types";

type ObserverCallback = () => void;

export function createDOMObserver(
  extractor: PlatformExtractor,
  onReady: ObserverCallback
): MutationObserver {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (extractor.isResponseReady(document)) {
        onReady();
      }
    }, 800);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}
