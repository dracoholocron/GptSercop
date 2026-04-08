import { useState, useEffect } from 'react';
import type { UIContext, HostAdapter } from '../types/index.js';
import { collectContext } from '../context/ContextCollector.js';

export function usePageContext(adapter?: HostAdapter) {
  const [context, setContext] = useState<UIContext>(() => collectContext(adapter));

  useEffect(() => {
    const update = () => setContext(collectContext(adapter));

    update();

    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);

    const observer = new MutationObserver(() => {
      update();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
      observer.disconnect();
    };
  }, [adapter]);

  return context;
}
