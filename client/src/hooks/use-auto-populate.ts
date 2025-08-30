import { useState, useCallback } from 'react';
import AutoPopulateService from '@/services/auto-populate-service';

interface UseAutoPopulateReturn {
  isLoading: boolean;
  error: string | null;
  data: any;
  source: string | null;
  message: string | null;
  autoPopulate: (uploadType: 'secondary-sales' | 'inventory' | 'po', identifier: string, platform?: string) => Promise<void>;
  clearData: () => void;
}

export function useAutoPopulate(): UseAutoPopulateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [source, setSource] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const autoPopulate = useCallback(async (
    uploadType: 'secondary-sales' | 'inventory' | 'po', 
    identifier: string, 
    platform?: string
  ) => {
    if (!identifier.trim()) {
      setError('Identifier is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);
    setSource(null);
    setMessage(null);

    try {
      const result = await AutoPopulateService.autoPopulate({
        uploadType,
        identifier: identifier.trim(),
        platform
      });

      if (result.found) {
        setData(result.data);
        setSource(result.source);
        setMessage(result.message);
        console.log('✅ Auto-populate successful:', result);
      } else {
        setError(result.message);
        setMessage(result.message);
        console.log('⚠️ Auto-populate found no data:', result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-populate data';
      setError(errorMessage);
      console.error('❌ Auto-populate error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
    setSource(null);
    setMessage(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    source,
    message,
    autoPopulate,
    clearData
  };
}

export default useAutoPopulate;