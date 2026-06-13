import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LectureCard } from '../components/LectureCard';
import { LectureForm } from '../components/LectureForm';
import type { Lecture } from '../types';

const statusColor = (status: Lecture['status']) => {
  if (status === 'completed') return 'var(--status-done)';
  if (status === 'failed')    return 'var(--status-failed)';
  return 'var(--status-progress)';
};

export const LectureList = () => {
  const { lectures, loading, error, addLecture } = useApp();
  const [showForm, setShowForm] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Lecture[]>();
    for (const l of lectures) {
      const key = l.course_name || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [lectures]);

  if (loading && lectures.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>

        {/* Wordmark */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1 className="font-syne font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Academic<span style={{ color: 'var(--accent)' }}>AI</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>TUM Lecture Assistant</p>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link
            to="/chat"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Q&A Chat
          </Link>
        </div>

        {/* Lecture list */}
        <div className="flex-1 overflow-y-auto py-3">
          {lectures.length === 0 ? (
            <p className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>No lectures yet</p>
          ) : (
            Array.from(grouped.entries()).map(([course, courseLectures]) => (
              <div key={course} className="mb-3">
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {course}
                </p>
                {courseLectures.map((l) => (
                  <Link
                    key={l.id}
                    to={`/lectures/${l.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: statusColor(l.status) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        {l.lecture_number ? `Lecture ${l.lecture_number}` : 'Lecture'}
                      </p>
                      {l.date && (
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {new Date(l.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Add Lecture */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Lecture
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-8 p-4 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--status-failed)' }}>
            {error}
          </div>
        )}

        {lectures.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'var(--accent-soft)', border: '1px solid rgba(107,127,255,0.2)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-syne font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                No lectures yet
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Add a TUM lecture recording to start generating notes, quizzes, and more.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Add your first lecture
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-2xl">
            <div className="mb-6">
              <h2 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                Lectures
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {lectures.length} lecture{lectures.length !== 1 ? 's' : ''} · {grouped.size} course{grouped.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-3">
              {lectures.map((lecture) => (
                <LectureCard key={lecture.id} lecture={lecture} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <LectureForm onSubmit={addLecture} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
