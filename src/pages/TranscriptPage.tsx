import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import type { TranscriptSegment } from '../types';

export const TranscriptPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const lecture = lectures.find((l) => l.id === id);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await api.getTranscript(id);
        setTranscript(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load transcript'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [id]);

  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h${minutes}m${secs}s`;
    }
    return `${minutes}m${secs}s`;
  };

  const handleTimestampClick = (segment: TranscriptSegment) => {
    if (!lecture?.url) return;
    const timeParam = formatTimestamp(segment.start_seconds);
    const url = `${lecture.url}?t=${timeParam}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading transcript...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Lectures
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getLectureTitle = () => {
    if (!lecture) return 'Transcript';
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Transcript';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            ← Back to Lectures
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getLectureTitle()}
          </h1>
          {lecture?.date && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date(lecture.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 space-y-4">
            {transcript.map((segment, index) => (
              <div key={index} className="flex gap-4">
                <button
                  onClick={() => handleTimestampClick(segment)}
                  className="flex-shrink-0 font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  [{segment.timestamp}]
                </button>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {segment.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
