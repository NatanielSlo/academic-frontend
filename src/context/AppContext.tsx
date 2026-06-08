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
    setLectures((prev) => [newLecture, ...prev]);
    return newLecture;
  };

  useEffect(() => {
    refreshLectures();
  }, []);

  // Poll for processing lectures
  useEffect(() => {
    const processingLectures = lectures.filter(
      (l) => l.status === 'processing' || l.status === 'pending'
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
            return update || lecture;
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
