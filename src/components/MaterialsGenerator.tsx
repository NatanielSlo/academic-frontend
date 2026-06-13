import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentGeneration } from '../hooks/useContentGeneration';

interface MaterialsGeneratorProps {
  lectureId: string;
}

const statusLabels = {
  not_started: 'Queued',
  generating_outline: 'Analyzing lecture content...',
  generating_notes: 'Writing detailed notes...',
  generating_quiz: 'Creating quiz questions...',
  verifying: 'Verifying quality...',
  completed: 'Complete!',
  failed: 'Failed',
};

export const MaterialsGenerator = ({ lectureId }: MaterialsGeneratorProps) => {
  const { status, isGenerating, error, startGeneration } =
    useContentGeneration(lectureId);
  const navigate = useNavigate();
  const [numQuestions, setNumQuestions] = useState(20);
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = async () => {
    await startGeneration(numQuestions);
    setShowModal(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Generate Study Materials
      </h2>

      {!isGenerating && !status && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Generate comprehensive notes and quiz (2-3 minutes, ~$0.30)
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Generate Notes & Quiz
          </button>
        </div>
      )}

      {isGenerating && status && (
        <div className="space-y-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.progress_percent}%` }}
            />
          </div>

          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-white">
              {statusLabels[status.status] || status.status}
            </p>
            {status.current_step && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {status.current_step}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-500 mt-1">
              {status.progress_percent}%
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Please wait, this may take 2-3 minutes...</span>
          </div>
        </div>
      )}

      {status?.status === 'completed' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-lg">Materials ready!</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/lectures/${lectureId}/notes`)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors"
            >
              View Notes
            </button>
            <button
              onClick={() => navigate(`/lectures/${lectureId}/comprehensive-quiz`)}
              className="flex-1 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors"
            >
              Take Quiz
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Generate Study Materials
            </h3>

            <div className="mb-4">
              <label
                htmlFor="numQuestions"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Number of Quiz Questions
              </label>
              <input
                type="number"
                id="numQuestions"
                min="10"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 20 questions
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This will generate:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-4 list-disc">
                <li>Detailed notes (10-20 pages)</li>
                <li>{numQuestions}+ quiz questions</li>
                <li>Quality & coverage report</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Time: 2-3 minutes • Cost: ~$0.30
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors"
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
