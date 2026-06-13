import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { contentApi } from '../services/contentApi';
import { useApp } from '../context/AppContext';
import type {
  ComprehensiveQuizResponse,
  StatusResponse,
  QuizQuestion,
} from '../types/content';

// Open-ended (short_answer) questions can't be auto-graded, so the learner grades
// their own answer against the model answer. These map to fractional points.
type SelfGrade = 'correct' | 'partial' | 'incorrect';

const isAutoGraded = (q: QuizQuestion) =>
  q.type === 'multiple_choice' || q.type === 'true_false';

export const ComprehensiveQuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // ?quizId= -> retake that specific quiz; ?new=1 -> go straight to the generate screen.
  const quizIdParam = searchParams.get('quizId');
  const newMode = searchParams.get('new') === '1';
  const { lectures } = useApp();
  const [quizData, setQuizData] = useState<ComprehensiveQuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selfGrades, setSelfGrades] = useState<Record<number, SelfGrade>>({});
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<StatusResponse | null>(null);
  const [numQuestions, setNumQuestions] = useState(20);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lecture = lectures.find((l) => l.id === id);

  const loadQuiz = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = quizIdParam
        ? await contentApi.getQuiz(quizIdParam)
        : await contentApi.getComprehensiveQuiz(id);
      setQuizData(data);
      setNotFound(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  }, [id, quizIdParam]);

  useEffect(() => {
    // "New Quiz" (?new=1) opens the generate screen directly instead of loading the
    // latest existing quiz. Retake (?quizId=) and the default path both load a quiz.
    if (newMode && !quizIdParam) {
      setNotFound(true);
      setLoading(false);
    } else {
      loadQuiz();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadQuiz, newMode, quizIdParam]);

  const handleGenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    setGenStatus(null);
    setError('');
    try {
      await contentApi.generateQuiz(id, numQuestions);
    } catch (err: any) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const status = await contentApi.getGenerationStatus(id);
        setGenStatus(status);
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsGenerating(false);
          if (status.status === 'completed') {
            setCurrentIndex(0);
            setAnswers({});
            setSelfGrades({});
            setSaveState('idle');
            setShowResults(false);
            loadQuiz();
          } else {
            setError(status.error_message || 'Generation failed');
          }
        }
      } catch {}
    }, 3000);
  };

  const getLectureTitle = () => {
    if (!lecture) return 'Quiz';
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Quiz';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Generating Quiz
          </h2>
          {genStatus && (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${genStatus.progress_percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {genStatus.current_step || 'Processing...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{genStatus.progress_percent}%</p>
            </>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This may take 1-2 minutes
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to={`/lectures/${id}`}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              ← Back to Lecture
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getLectureTitle()} - Quiz
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              {newMode
                ? 'Create a new quiz for this lecture.'
                : 'A quiz has not been generated yet for this lecture.'}
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <label
                htmlFor="numQuestions"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                Number of questions:
              </label>
              <input
                type="number"
                id="numQuestions"
                min="10"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
              />
            </div>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Generate Quiz
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to={`/lectures/${id}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Lecture
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const questions = quizData!.questions;
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const allAnswered = questions.every((q) => answers[q.question_id]);

  if (showResults) {
    // Auto-graded questions score by exact match; open-ended (short_answer) use the
    // learner's self-grade (correct = 1, partial = 0.5, incorrect/ungraded = 0).
    const questionScore = (q: QuizQuestion) => {
      if (isAutoGraded(q)) {
        return answers[q.question_id] === q.correct_answer ? 1 : 0;
      }
      const g = selfGrades[q.question_id];
      return g === 'correct' ? 1 : g === 'partial' ? 0.5 : 0;
    };
    const score = questions.reduce((sum, q) => sum + questionScore(q), 0);
    const percentage = Math.round((score / questions.length) * 100);
    const scoreLabel = Number.isInteger(score) ? `${score}` : score.toFixed(1);
    const openEndedCount = questions.filter((q) => !isAutoGraded(q)).length;
    const ungradedOpen = questions.filter(
      (q) => !isAutoGraded(q) && !selfGrades[q.question_id]
    ).length;

    const handleSaveAttempt = async () => {
      if (!quizData) return;
      setSaving(true);
      setSaveError('');
      try {
        await contentApi.submitQuizAttempt(quizData.quiz_id, {
          score,
          total: questions.length,
          answers,
          self_grades: selfGrades,
        });
        setSaveState('saved');
      } catch (err: any) {
        setSaveState('error');
        setSaveError(
          err?.response?.data?.detail ||
            (err instanceof Error ? err.message : 'Failed to save result')
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to={`/lectures/${id}`}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              ← Back to Lecture
            </Link>
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
                  {scoreLabel}/{questions.length}
                </div>
                <div className="text-2xl text-gray-600 dark:text-gray-400">
                  ({percentage}%)
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {openEndedCount > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This quiz has {openEndedCount} open-ended question
                {openEndedCount > 1 ? 's' : ''} that can't be graded automatically.
                Compare your answer with the model answer and grade yourself — your
                self-assessment is included in the score above.
                {ungradedOpen > 0 && (
                  <span className="font-semibold">
                    {' '}
                    ({ungradedOpen} not yet graded.)
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = answers[question.question_id];
              const autoGraded = isAutoGraded(question);
              const status: 'correct' | 'partial' | 'incorrect' | 'ungraded' =
                autoGraded
                  ? userAnswer === question.correct_answer
                    ? 'correct'
                    : 'incorrect'
                  : selfGrades[question.question_id] ?? 'ungraded';
              const isCorrect = status === 'correct';
              const borderClass =
                status === 'correct'
                  ? 'border-green-500'
                  : status === 'partial'
                  ? 'border-yellow-500'
                  : status === 'incorrect'
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600';
              const badge =
                status === 'correct'
                  ? { cls: 'bg-green-500', sym: '✓' }
                  : status === 'partial'
                  ? { cls: 'bg-yellow-500', sym: '≈' }
                  : status === 'incorrect'
                  ? { cls: 'bg-red-500', sym: '✗' }
                  : { cls: 'bg-gray-400', sym: '?' };

              return (
                <div
                  key={question.question_id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 p-6 ${borderClass}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${badge.cls}`}
                    >
                      {badge.sym}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {question.difficulty}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {question.topic}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Question {index + 1}: {question.question_text}
                      </h3>

                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option) => {
                            const isUserAnswer = option.label === userAnswer;
                            const isCorrectAnswer =
                              option.label === question.correct_answer;

                            return (
                              <div
                                key={option.label}
                                className={`p-3 rounded-md ${
                                  isCorrectAnswer
                                    ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                                    : isUserAnswer && !isCorrect
                                    ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                                }`}
                              >
                                <span className="text-gray-900 dark:text-white">
                                  <strong>{option.label}.</strong> {option.text}
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                      (Correct)
                                    </span>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                      (Your answer)
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'true_false' && (
                        <div className="space-y-2 mb-4">
                          {['True', 'False'].map((option) => {
                            const isUserAnswer = option === userAnswer;
                            const isCorrectAnswer =
                              option === question.correct_answer;

                            return (
                              <div
                                key={option}
                                className={`p-3 rounded-md ${
                                  isCorrectAnswer
                                    ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                                    : isUserAnswer && !isCorrect
                                    ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                                }`}
                              >
                                <span className="text-gray-900 dark:text-white">
                                  {option}
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                      (Correct)
                                    </span>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                      (Your answer)
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'short_answer' && (
                        <div className="space-y-3 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Your answer:
                            </p>
                            <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white whitespace-pre-wrap">
                              {userAnswer || (
                                <em className="text-gray-500">(no answer)</em>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Model answer:
                            </p>
                            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-gray-900 dark:text-white whitespace-pre-wrap">
                              {question.correct_answer}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Grade yourself:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(
                                [
                                  {
                                    g: 'correct',
                                    label: 'Correct',
                                    active:
                                      'bg-green-600 text-white border-green-600',
                                  },
                                  {
                                    g: 'partial',
                                    label: 'Partially',
                                    active:
                                      'bg-yellow-500 text-white border-yellow-500',
                                  },
                                  {
                                    g: 'incorrect',
                                    label: 'Incorrect',
                                    active: 'bg-red-600 text-white border-red-600',
                                  },
                                ] as { g: SelfGrade; label: string; active: string }[]
                              ).map(({ g, label, active }) => {
                                const selected =
                                  selfGrades[question.question_id] === g;
                                return (
                                  <button
                                    key={g}
                                    onClick={() =>
                                      setSelfGrades({
                                        ...selfGrades,
                                        [question.question_id]: g,
                                      })
                                    }
                                    className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-colors ${
                                      selected
                                        ? active
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {question.explanation &&
                        (question.type === 'short_answer' || !isCorrect) && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                              {question.type === 'short_answer'
                                ? 'What a good answer should cover:'
                                : 'Explanation:'}
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            {saveState === 'saved' ? (
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✓ Result saved
              </p>
            ) : (
              <>
                <button
                  onClick={handleSaveAttempt}
                  disabled={saving || ungradedOpen > 0}
                  className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
                >
                  {saving ? 'Saving…' : 'Save result'}
                </button>
                {ungradedOpen > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Grade all open-ended questions to save your result.
                  </p>
                )}
                {saveState === 'error' && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {saveError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
                setAnswers({});
                setSelfGrades({});
                setSaveState('idle');
              }}
              className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => {
                setNotFound(true);
                setQuizData(null);
                setShowResults(false);
                setCurrentIndex(0);
                setAnswers({});
                setSelfGrades({});
                setSaveState('idle');
              }}
              className="px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
            >
              Generate New Quiz
            </button>
            <Link
              to={`/lectures/${id}`}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors inline-flex items-center"
            >
              Back to Lecture
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quiz
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {quizData!.quiz_metadata.topics_covered.join(', ')}
                </p>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {currentQuestion.difficulty}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {currentQuestion.topic}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question_text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.type === 'multiple_choice' &&
                currentQuestion.options?.map((option) => (
                  <label
                    key={option.label}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion.question_id] === option.label
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.question_id}`}
                      value={option.label}
                      checked={
                        answers[currentQuestion.question_id] === option.label
                      }
                      onChange={() => handleAnswer(option.label)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white">
                      <strong>{option.label}.</strong> {option.text}
                    </span>
                  </label>
                ))}

              {currentQuestion.type === 'true_false' &&
                ['True', 'False'].map((answer) => (
                  <label
                    key={answer}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion.question_id] === answer
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.question_id}`}
                      value={answer}
                      checked={answers[currentQuestion.question_id] === answer}
                      onChange={() => handleAnswer(answer)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white font-medium">
                      {answer}
                    </span>
                  </label>
                ))}

              {currentQuestion.type === 'short_answer' && (
                <div>
                  <textarea
                    value={answers[currentQuestion.question_id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type your answer..."
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-y"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Open-ended — you'll compare against a model answer and grade
                    yourself at the end.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              ← Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.question_id]}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!allAnswered}
                className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
              >
                {allAnswered ? 'Finish' : 'Answer all questions'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
