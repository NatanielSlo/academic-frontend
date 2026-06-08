import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import type { Quiz } from '../types';

export const QuizListPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lectures } = useApp();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState('');

  const lecture = lectures.find((l) => l.id === id);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await api.getQuizzes(id);
        setQuizzes(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load quizzes'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [id]);

  const handleGenerateQuiz = async () => {
    if (!id || generating) return;

    try {
      setGenerating(true);
      setError('');
      const newQuiz = await api.generateQuiz(id, questionCount);
      setShowModal(false);
      navigate(`/quizzes/${newQuiz.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate quiz'
      );
    } finally {
      setGenerating(false);
    }
  };

  const getLectureTitle = () => {
    if (!lecture) return 'Quizzes';
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Quizzes';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quizzes...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getLectureTitle()} - Quizzes
              </h1>
              {lecture?.date && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(lecture.date).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Generate New Quiz
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No quizzes yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generate your first quiz to start practicing.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Generate New Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quiz - {new Date(quiz.created_at).toLocaleDateString()}
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {quiz.questions_count} questions
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Attempts: {quiz.attempts_count}</span>
                      {quiz.best_score !== undefined && (
                        <span>
                          Best Score: {quiz.best_score}/{quiz.questions_count} (
                          {Math.round((quiz.best_score / quiz.questions_count) * 100)}
                          %)
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/quizzes/${quiz.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Take Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Generate New Quiz
            </h2>

            <div className="mb-4">
              <label
                htmlFor="questionCount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Number of Questions
              </label>
              <input
                type="number"
                id="questionCount"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleGenerateQuiz}
                disabled={generating}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md font-medium transition-colors"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
