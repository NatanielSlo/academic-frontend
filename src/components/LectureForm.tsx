import { useState, FormEvent } from 'react';

interface LectureFormProps {
  onSubmit: (data: {
    url: string;
    course_name?: string;
    lecture_number?: string;
    date?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-md)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
      {label}
      {required && <span className="ml-1" style={{ color: 'var(--status-failed)' }}>*</span>}
    </label>
    {children}
  </div>
);

export const LectureForm = ({ onSubmit, onClose }: LectureFormProps) => {
  const [url, setUrl] = useState('');
  const [courseName, setCourseName] = useState('');
  const [lectureNumber, setLectureNumber] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) { setError('URL is required'); return; }
    if (!url.startsWith('https://live.rbg.tum.de/')) {
      setError('URL must start with https://live.rbg.tum.de/');
      return;
    }
    try {
      setLoading(true);
      await onSubmit({
        url: url.trim(),
        course_name: courseName.trim() || undefined,
        lecture_number: lectureNumber.trim() || undefined,
        date: date || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-md)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Add Lecture
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Lecture URL" required>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://live.rbg.tum.de/w/eidi/20838"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-md)')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Course Name">
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="EIDI"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-md)')}
              />
            </Field>
            <Field label="Lecture No.">
              <input
                type="text"
                value={lectureNumber}
                onChange={e => setLectureNumber(e.target.value)}
                placeholder="5"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-md)')}
              />
            </Field>
          </div>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-md)')}
            />
          </Field>

          {error && (
            <p className="text-xs" style={{ color: 'var(--status-failed)' }}>{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}
            >
              {loading ? 'Adding…' : 'Add Lecture'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'transparent', border: '1px solid var(--border-md)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-md)'; }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
