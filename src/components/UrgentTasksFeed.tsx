import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useUrgentTasks } from '../hooks/useUrgentTasks';
import type { Lecture } from '../types';

const lectureLabel = (l: Lecture) => {
  const parts: string[] = [];
  if (l.course_name) parts.push(l.course_name);
  if (l.lecture_number) parts.push(`Lec. ${l.lecture_number}`);
  return parts.length ? parts.join(' · ') : 'Lecture';
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// ── Skeleton ──────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className="rounded-lg p-4 animate-pulse"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="h-3 w-1/3 rounded mb-3" style={{ background: 'var(--border-md)' }} />
        <div className="space-y-2">
          <div className="h-3 w-4/5 rounded" style={{ background: 'var(--border-md)' }} />
          <div className="h-2.5 w-3/5 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    ))}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
export const UrgentTasksFeed = () => {
  const { lectures } = useApp();
  const { urgentTasks, loading, toggleDone } = useUrgentTasks(lectures);

  // Group consecutive tasks that belong to the same lecture
  const groups: Array<{ lecture: Lecture; tasks: typeof urgentTasks }> = [];
  for (const ut of urgentTasks) {
    const last = groups[groups.length - 1];
    if (last && last.lecture.id === ut.lecture.id) {
      last.tasks.push(ut);
    } else {
      groups.push({ lecture: ut.lecture, tasks: [ut] });
    }
  }

  const completedLectures = lectures.filter(l => l.status === 'completed');
  const lecturesWithoutPlan = completedLectures.length > 0 && !loading && urgentTasks.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-syne font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            What's Next
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Undone tasks · oldest lectures first
          </p>
        </div>
        {urgentTasks.length > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {urgentTasks.length} left
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Empty — no study plans generated yet */}
      {!loading && completedLectures.length === 0 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: '1px dashed var(--border-md)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Add a lecture and generate its study plan to see tasks here.
          </p>
        </div>
      )}

      {/* Empty — lectures exist but no undone tasks */}
      {!loading && lecturesWithoutPlan && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: '1px dashed var(--border-md)' }}
        >
          <div className="text-2xl mb-2">🎉</div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            All caught up!
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            No pending tasks across any study plan.
          </p>
        </div>
      )}

      {/* Task groups */}
      {!loading && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map(({ lecture, tasks }) => (
            <div
              key={lecture.id}
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            >
              {/* Lecture header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--status-progress)' }}
                  />
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lectureLabel(lecture)}
                  </span>
                  {lecture.date && (
                    <span
                      className="text-[10px] flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatDate(lecture.date)}
                    </span>
                  )}
                </div>
                <Link
                  to={`/lectures/${lecture.id}/study-plan`}
                  className="text-[11px] flex-shrink-0 ml-3 hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  View plan →
                </Link>
              </div>

              {/* Tasks */}
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {tasks.map(({ task }) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-3.5 group"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleDone(task.id)}
                      aria-label="Mark as done"
                      className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                      style={{ borderColor: 'var(--text-muted)' }}
                      onMouseEnter={e =>
                        ((e.currentTarget as HTMLElement).style.borderColor = 'var(--status-done)')
                      }
                      onMouseLeave={e =>
                        ((e.currentTarget as HTMLElement).style.borderColor = 'var(--text-muted)')
                      }
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
