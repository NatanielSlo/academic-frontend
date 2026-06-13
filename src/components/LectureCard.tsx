import { Link } from 'react-router-dom';
import type { Lecture } from '../types';

interface LectureCardProps {
  lecture: Lecture;
}

export const LectureCard = ({ lecture }: LectureCardProps) => {
  // Anything that isn't a terminal state is still being processed.
  const inProgress =
    lecture.status !== 'completed' && lecture.status !== 'failed';

  const getStatusBadge = () => {
    if (lecture.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✓ Completed
        </span>
      );
    }
    if (lecture.status === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          ✗ Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 capitalize">
        {lecture.status}
      </span>
    );
  };

  const getLectureTitle = () => {
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Untitled Lecture';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <Link to={`/lectures/${lecture.id}`} className="block mb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {getLectureTitle()}
          </h3>
          {getStatusBadge()}
        </div>
      </Link>

      {lecture.date && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {new Date(lecture.date).toLocaleDateString()}
        </p>
      )}

      {inProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {lecture.current_step || lecture.status || 'Processing...'}
            </span>
            {lecture.progress !== undefined && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {lecture.progress}%
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${lecture.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {lecture.status === 'failed' && lecture.error_message && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">
          {lecture.error_message}
        </p>
      )}

      {lecture.status === 'completed' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Link
              to={`/lectures/${lecture.id}/transcript`}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Transcript
            </Link>
            <Link
              to={`/lectures/${lecture.id}/notes`}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Notes
            </Link>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/lectures/${lecture.id}/quizzes`}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Old Quizzes
            </Link>
            <Link
              to={`/lectures/${lecture.id}/comprehensive-quiz`}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-green-700 dark:text-green-300 border border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Study Quiz
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
