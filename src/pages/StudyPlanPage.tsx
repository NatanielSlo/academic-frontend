import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { StudyPlan, StudyPlanTask } from '../types';

export const StudyPlanPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const lecture = lectures.find((l) => l.id === id);

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getLectureTitle = () => {
    if (!lecture) return 'Study Plan';
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Study Plan';
  };

  const loadPlan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudyPlan(id);
      setPlan(data);
      setNotFound(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load study plan');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    setError('');
    try {
      const data = await api.generateStudyPlan(id);
      setPlan(data);
      setNotFound(false);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (task: StudyPlanTask) => {
    if (togglingId === task.id) return;
    setTogglingId(task.id);
    const newDone = !task.done;
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, done: newDone } : t
            ),
          }
        : prev
    );
    try {
      await api.updateStudyPlanTask(task.id, newDone);
    } catch {
      // revert on failure
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === task.id ? { ...t, done: task.done } : t
              ),
            }
          : prev
      );
    } finally {
      setTogglingId(null);
    }
  };

  const completedCount = plan?.tasks.filter((t) => t.done).length ?? 0;
  const totalCount = plan?.tasks.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading study plan...</p>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Generating Study Plan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This may take a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to={`/lectures/${id}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            ← Back to Lecture
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getLectureTitle()} — Study Plan
          </h1>
          {plan?.generated_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generated on {new Date(plan.generated_at).toLocaleString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {notFound || !plan ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              No study plan has been generated for this lecture yet.
            </p>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Generate Study Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {completedCount} / {totalCount} tasks
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {progressPercent}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {plan.tasks
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-5 transition-colors ${
                      task.done ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={togglingId === task.id}
                      aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.done
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      } ${togglingId === task.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {task.done && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-gray-900 dark:text-white ${
                          task.done ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p
                          className={`mt-1 text-sm ${
                            task.done
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleGenerate}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline"
              >
                Regenerate study plan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
