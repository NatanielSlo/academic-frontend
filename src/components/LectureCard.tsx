import { Link } from 'react-router-dom';
import type { Lecture } from '../types';

interface Props {
  lecture: Lecture;
}

const statusMeta = (status: Lecture['status']) => {
  if (status === 'completed')   return { color: 'var(--status-done)',     label: 'Completed' };
  if (status === 'failed')      return { color: 'var(--status-failed)',   label: 'Failed' };
  if (status === 'pending')     return { color: 'var(--status-pending)',  label: 'Pending' };
  return                               { color: 'var(--status-progress)', label: 'Processing' };
};

const inProgress = (status: Lecture['status']) =>
  status !== 'completed' && status !== 'failed';

export const LectureCard = ({ lecture }: Props) => {
  const { color, label } = statusMeta(lecture.status);
  const processing = inProgress(lecture.status);

  const title = [
    lecture.course_name,
    lecture.lecture_number ? `Lecture ${lecture.lecture_number}` : null,
  ].filter(Boolean).join(' — ') || 'Untitled Lecture';

  return (
    <div
      className="relative rounded-xl overflow-hidden flex"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Left status bar */}
      <div className="w-[3px] flex-shrink-0 self-stretch" style={{ background: color }} />

      <div className="flex-1 px-5 py-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <Link to={`/lectures/${lecture.id}`} className="group flex-1 min-w-0">
            <h3
              className="font-syne font-bold text-base leading-snug transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            >
              {title}
            </h3>
          </Link>

          {/* Status indicator — subtle dot + label */}
          <span
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        </div>

        {/* Date */}
        {lecture.date && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {new Date(lecture.date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}

        {/* Progress bar */}
        {processing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                {lecture.current_step || lecture.status || 'Processing…'}
              </span>
              {lecture.progress !== undefined && (
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {lecture.progress}%
                </span>
              )}
            </div>
            <div className="h-[3px] rounded-full" style={{ background: 'var(--border-md)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${lecture.progress || 0}%`, background: color }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {lecture.status === 'failed' && lecture.error_message && (
          <p className="text-xs mb-3" style={{ color: 'var(--status-failed)' }}>
            {lecture.error_message}
          </p>
        )}

        {/* Actions */}
        {lecture.status === 'completed' && (
          <div className="flex flex-wrap gap-2 mt-3">
            <ActionLink to={`/lectures/${lecture.id}/transcript`} primary>
              Transcript
            </ActionLink>
            <ActionLink to={`/lectures/${lecture.id}/notes`}>
              Notes
            </ActionLink>
            <ActionLink to={`/lectures/${lecture.id}/comprehensive-quiz?new=1`}>
              New Quiz
            </ActionLink>
            <ActionLink to={`/lectures/${lecture.id}/quizzes`}>
              Past Quizzes
            </ActionLink>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionLink = ({
  to,
  children,
  primary,
}: {
  to: string;
  children: React.ReactNode;
  primary?: boolean;
}) => (
  <Link
    to={to}
    className="px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors"
    style={
      primary
        ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(107,127,255,0.2)' }
        : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-md)' }
    }
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement;
      if (primary) {
        el.style.background = 'rgba(107,127,255,0.2)';
      } else {
        el.style.color = 'var(--text-primary)';
        el.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement;
      if (primary) {
        el.style.background = 'var(--accent-soft)';
      } else {
        el.style.color = 'var(--text-secondary)';
        el.style.borderColor = 'var(--border-md)';
      }
    }}
  >
    {children}
  </Link>
);
