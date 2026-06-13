import { useState, useEffect, useCallback } from 'react';
import { contentApi } from '../services/contentApi';
import type { StatusResponse } from '../types/content';

export function useContentGeneration(lectureId: string) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback(
    async (numQuestions: number = 20) => {
      try {
        setError(null);
        setIsGenerating(true);
        const result = await contentApi.generateMaterials(
          lectureId,
          numQuestions
        );
        setStatus(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to start generation'
        );
        setIsGenerating(false);
      }
    },
    [lectureId]
  );

  // Poll status while generating
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const newStatus = await contentApi.getGenerationStatus(lectureId);
        setStatus(newStatus);

        if (
          newStatus.status === 'completed' ||
          newStatus.status === 'failed'
        ) {
          setIsGenerating(false);
          if (newStatus.status === 'failed') {
            setError(newStatus.error_message || 'Generation failed');
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isGenerating, lectureId]);

  return {
    status,
    isGenerating,
    error,
    startGeneration,
  };
}
