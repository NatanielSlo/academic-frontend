import { useState, FormEvent, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import type { ChatMessage, ChatScope } from '../types';

export const ChatPage = () => {
  const { lectures } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [scope, setScope] = useState<ChatScope>('global');
  const [scopeId, setScopeId] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const completedLectures = lectures.filter((l) => l.status === 'completed');
  const courses = Array.from(
    new Set(
      completedLectures
        .map((l) => l.course_name)
        .filter((c): c is string => !!c)
    )
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage({
        question: question.trim(),
        scope,
        scope_id: scope !== 'global' ? scopeId : undefined,
      });

      setMessages((prev) => [...prev, response]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          err instanceof Error
            ? `Error: ${err.message}`
            : 'Failed to get response',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getLectureById = (id: string) => {
    return lectures.find((l) => l.id === id);
  };

  const handleSourceClick = (lectureId: string, startSeconds: number) => {
    const lecture = getLectureById(lectureId);
    if (!lecture?.url) return;

    const hours = Math.floor(startSeconds / 3600);
    const minutes = Math.floor((startSeconds % 3600) / 60);
    const secs = Math.floor(startSeconds % 60);

    const timeParam = hours > 0 ? `${hours}h${minutes}m${secs}s` : `${minutes}m${secs}s`;
    const url = `${lecture.url}?t=${timeParam}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            ← Back to Lectures
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat with Your Lectures
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ask questions about your lecture content
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as ChatScope);
                  setScopeId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="global">All Lectures</option>
                <option value="course">Specific Course</option>
                <option value="lecture">Specific Lecture</option>
              </select>
            </div>

            {scope === 'course' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select course...</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'lecture' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lecture
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select lecture...</option>
                  {completedLectures.map((lecture) => {
                    const title = [
                      lecture.course_name,
                      lecture.lecture_number
                        ? `Lecture ${lecture.lecture_number}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' - ') || `Lecture ${lecture.id}`;
                    return (
                      <option key={lecture.id} value={lecture.id}>
                        {title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4 flex flex-col">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Ask a question to get started
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
                          Sources:
                        </p>
                        <ul className="space-y-1">
                          {message.sources.map((source, index) => (
                            <li key={index}>
                              <button
                                onClick={() =>
                                  handleSourceClick(
                                    source.lecture_id,
                                    source.start_seconds
                                  )
                                }
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                • {source.lecture_name} - {source.timestamp}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
