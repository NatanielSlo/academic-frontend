import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { useApp } from '../context/AppContext';
import { contentApi } from '../services/contentApi';
import type { NotesResponse, StatusResponse } from '../types/content';

const LANGUAGES = [
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const markdownComponents = {
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const language = /language-(\w+)/.exec(className || '')?.[1];
    if (language === 'mermaid') {
      return <MermaidDiagram code={String(children).trim()} />;
    }
    return <code className={className}>{children}</code>;
  },
};

export const NotesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const [notes, setNotes] = useState<NotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<StatusResponse | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const translationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lecture = lectures.find((l) => l.id === id);

  const loadNotes = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await contentApi.getNotes(id);
      setNotes(data);
      setNotFound(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadNotes();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (translationPollRef.current) clearInterval(translationPollRef.current);
    };
  }, [loadNotes]);

  const handleGenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    setGenStatus(null);
    setError('');
    try {
      await contentApi.generateNotes(id);
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
            loadNotes();
          } else {
            setError(status.error_message || 'Generation failed');
          }
        }
      } catch {}
    }, 3000);
  };

  const handleSelectLanguage = async (lang: string | null) => {
    if (lang === null) {
      setSelectedLang(null);
      setTranslationError('');
      return;
    }

    setSelectedLang(lang);
    setTranslationError('');

    if (translations[lang]) return;

    if (!id) return;

    try {
      const data = await contentApi.getNotesTranslation(id, lang);
      setTranslations((prev) => ({ ...prev, [lang]: data.notes_markdown }));
      return;
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setTranslationError('Failed to load translation');
        return;
      }
    }

    setTranslating(true);
    try {
      await contentApi.translateNotes(id, lang);
    } catch {
      setTranslating(false);
      setTranslationError('Failed to start translation');
      return;
    }

    translationPollRef.current = setInterval(async () => {
      try {
        const data = await contentApi.getNotesTranslation(id, lang);
        clearInterval(translationPollRef.current!);
        translationPollRef.current = null;
        setTranslating(false);
        setTranslations((prev) => ({ ...prev, [lang]: data.notes_markdown }));
      } catch {}
    }, 3000);
  };

  const getLectureTitle = () => {
    if (!lecture) return 'Notes';
    const parts = [];
    if (lecture.course_name) parts.push(lecture.course_name);
    if (lecture.lecture_number) parts.push(`Lecture ${lecture.lecture_number}`);
    return parts.length > 0 ? parts.join(' - ') : 'Notes';
  };

  const displayedMarkdown = selectedLang
    ? (translations[selectedLang] ?? '')
    : (notes?.notes_markdown ?? '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
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
            Generating Notes
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
              <p className="text-xs text-gray-500 mt-1">
                {genStatus.progress_percent}%
              </p>
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
              {getLectureTitle()} - Notes
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Notes have not been generated yet for this lecture.
            </p>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Generate Notes
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
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
            {getLectureTitle()} - Notes
          </h1>
          {notes?.generated_at && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generated on {new Date(notes.generated_at).toLocaleString()}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Translate:</span>
          <button
            onClick={() => handleSelectLanguage(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedLang === null
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            Original
          </button>
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => handleSelectLanguage(code)}
              disabled={translating && selectedLang === code}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                selectedLang === code
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span>{flag}</span>
              <span>{label}</span>
              {translations[code] && selectedLang !== code && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Already translated" />
              )}
            </button>
          ))}
        </div>

        {translating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            Translating… this may take a minute
          </div>
        )}
        {translationError && (
          <p className="mt-2 text-sm text-red-500">{translationError}</p>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
          {translating && !displayedMarkdown ? (
            <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
              Translating notes…
            </div>
          ) : (
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {displayedMarkdown}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </main>
    </div>
  );
};
