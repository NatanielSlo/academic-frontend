import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { QuizAttempt } from '../types';

export const QuizResultsPage = () => {
  const { quizId, attemptId } = useParams<{
    quizId: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttempt = async () => {
      if (!quizId || !attemptId) return;

      try {
        setLoading(true);
        const data = await api.getQuizAttempt(quizId, attemptId);
        setAttempt(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load results'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [quizId, attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400">
              {error || 'Failed to load results'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round(
    (attempt.score / attempt.total_questions) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Results
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div
                className={`text-5xl font-bold ${
                  percentage >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : percentage >= 60
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {attempt.score}/{attempt.total_questions}
              </div>
              <div className="text-2xl text-gray-600 dark:text-gray-400">
                ({percentage}%)
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {attempt.answers.map((answer, index) => (
            <div
              key={answer.question_id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 p-6 ${
                answer.is_correct
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                    answer.is_correct ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {answer.is_correct ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Question {index + 1}: {answer.question}
                  </h3>

                  <div className="space-y-2">
                    {Object.entries(answer.options).map(([key, value]) => {
                      const isUserAnswer = key === answer.user_answer;
                      const isCorrectAnswer = key === answer.correct_answer;

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-md ${
                            isCorrectAnswer
                              ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                              : isUserAnswer && !answer.is_correct
                              ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                          }`}
                        >
                          <span className="text-gray-900 dark:text-white">
                            <strong>{key}.</strong> {value}
                            {isCorrectAnswer && (
                              <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                (Correct)
                              </span>
                            )}
                            {isUserAnswer && !answer.is_correct && (
                              <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                (Your answer)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {!answer.is_correct && answer.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        Explanation:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {answer.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/quizzes/${quizId}`)}
            className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            Retake Quiz
          </button>
          <Link
            to="/"
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors"
          >
            Back to Lectures
          </Link>
        </div>
      </main>
    </div>
  );
};
