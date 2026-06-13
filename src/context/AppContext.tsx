import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lecture } from '../types';
import api from '../services/api';

interface AppContextType {
  lectures: Lecture[];
  loading: boolean;
  error: string | null;
  refreshLectures: () => Promise<void>;
  addLecture: (data: {
    url: string;
    course_name?: string;
    lecture_number?: string;
    date?: string;
  }) => Promise<Lecture>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLectures();
      setLectures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lectures');
    } finally {
      setLoading(false);
    }
  };

  const addLecture = async (data: {
    url: string;
    course_name?: string;
    lecture_number?: string;
    date?: string;
  }) => {
    const newLecture = await api.addLecture(data);
    // The POST response is minimal ({ id, status }). Reload the list so the new
    // lecture has its full DB record (url, course_name, created_at, ...) and a
    // real id for status polling.
    await refreshLectures();
    return newLecture;
  };

  useEffect(() => {
    refreshLectures();
  }, []);

  // Poll for processing lectures
  useEffect(() => {
    // Poll any lecture that hasn't reached a terminal state. The backend reports
    // intermediate statuses (downloading, transcribing, embedding) that aren't in
    // the narrow `processing`/`pending` set, so filter by what's NOT done instead.
    const processingLectures = lectures.filter(
      (l) => l.status !== 'completed' && l.status !== 'failed'
    );

    if (processingLectures.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updates = await Promise.all(
          processingLectures.map((l) => api.getLectureStatus(l.id))
        );

        setLectures((prev) =>
          prev.map((lecture) => {
            const update = updates.find((u) => u.id === lecture.id);
            // The status response is partial (id/status/progress/current_step), so
            // overlay it onto the existing lecture instead of replacing it — otherwise
            // course_name/date/url would vanish from the card while processing.
            return update ? { ...lecture, ...update } : lecture;
          })
        );
      } catch (err) {
        console.error('Failed to poll lecture status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lectures]);

  return (
    <AppContext.Provider
      value={{
        lectures,
        loading,
        error,
        refreshLectures,
        addLecture,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
