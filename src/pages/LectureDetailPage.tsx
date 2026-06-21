import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const LectureDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const lecture = lectures.find((l) => l.id === id);

  if (!lecture) {
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
            <p className="text-red-600 dark:text-red-400">Lecture not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getLectureTitle = () => {
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Lecture Details';
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
          {lecture.date && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date(lecture.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lecture.status === 'completed' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Available Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to={`/lectures/${lecture.id}/transcript`}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  📝 Transcript
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View lecture transcript with clickable timestamps
                </p>
              </Link>

              <Link
                to={`/lectures/${lecture.id}/notes`}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  📚 Notes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed notes generated from the lecture
                </p>
              </Link>

              <Link
                to={`/lectures/${lecture.id}/comprehensive-quiz?new=1`}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  ✅ New Quiz
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate a fresh AI quiz to test your knowledge
                </p>
              </Link>

              <Link
                to={`/lectures/${lecture.id}/quizzes`}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  🗂️ Old Quizzes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Revisit and retake previously generated quizzes
                </p>
              </Link>

              <Link
                to={`/lectures/${lecture.id}/study-plan`}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  📋 Study Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-generated task list to guide your study session
                </p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              Lecture is still processing. Materials will be available once
              processing is complete.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
