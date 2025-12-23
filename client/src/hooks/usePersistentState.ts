import { useEffect } from 'react';
import { usePipelineStore } from '../store/pipelineStore';

export const usePersistentState = () => {
  const store = usePipelineStore();

  useEffect(() => {
    // Load state on mount
    store.loadFromStorage();

    // Save state on beforeunload
    const handleBeforeUnload = () => {
      store.saveToStorage();
    };

    // Save state periodically
    const saveInterval = setInterval(() => {
      store.saveToStorage();
    }, 5000); // Save every 5 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(saveInterval);
      store.saveToStorage(); // Final save on cleanup
    };
  }, [store]);

  return store;
};