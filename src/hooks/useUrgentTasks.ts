import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import type { Lecture, StudyPlanTask } from '../types';

export interface UrgentTask {
  task: StudyPlanTask;
  lecture: Lecture;
}

export function useUrgentTasks(lectures: Lecture[]) {
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Completed lectures sorted oldest-first (no date → last)
  const sortedCompleted = useMemo(
    () =>
      lectures
        .filter(l => l.status === 'completed')
        .slice()
        .sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }),
    [lectures],
  );

  // Stable string key — only changes when the set of completed lecture IDs changes
  const completedKey = sortedCompleted.map(l => l.id).join(',');

  const fetchPlans = useCallback(async (lecturesToFetch: Lecture[]) => {
    if (lecturesToFetch.length === 0) {
      setUrgentTasks([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        lecturesToFetch.map(l => api.getStudyPlan(l.id)),
      );
      const tasks: UrgentTask[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          result.value.tasks
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .filter(t => !t.done)
            .forEach(task => tasks.push({ task, lecture: lecturesToFetch[i] }));
        }
        // 404 / no plan yet → silently skip
      });
      setUrgentTasks(tasks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever the set of completed lectures changes
  useEffect(() => {
    fetchPlans(sortedCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedKey, fetchPlans]);

  // Mark a task done: optimistic remove → API call → revert on failure
  const toggleDone = useCallback(
    async (taskId: string) => {
      setUrgentTasks(prev => prev.filter(ut => ut.task.id !== taskId));
      try {
        await api.updateStudyPlanTask(taskId, true);
      } catch {
        fetchPlans(sortedCompleted);
      }
    },
    [fetchPlans, sortedCompleted],
  );

  return { urgentTasks, loading, toggleDone };
}
