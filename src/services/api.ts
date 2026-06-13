import axios from 'axios';
import type {
  Lecture,
  TranscriptSegment,
  ChatRequest,
  ChatMessage,
  Quiz,
  QuizQuestion,
  QuizAttempt,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Lectures
  getLectures: async (): Promise<Lecture[]> => {
    const response = await apiClient.get('/api/lectures');
    return response.data.lectures || response.data;
  },

  getLecture: async (id: string): Promise<Lecture> => {
    const response = await apiClient.get(`/api/lectures/${id}`);
    return response.data;
  },

  addLecture: async (data: {
    url: string;
    course_name?: string;
    lecture_number?: string;
    date?: string;
  }): Promise<Lecture> => {
    const response = await apiClient.post('/api/lectures', data);
    // Backend returns { lecture_id, status }; normalize to the `id` field the UI uses.
    const d = response.data;
    return { ...d, id: d.id ?? d.lecture_id };
  },

  getLectureStatus: async (id: string): Promise<Lecture> => {
    const response = await apiClient.get(`/api/lectures/${id}/status`);
    // Backend returns { lecture_id, status, progress_percent, progress_message, error_message }.
    const d = response.data;
    return {
      ...d,
      id: d.id ?? d.lecture_id,
      progress: d.progress ?? d.progress_percent,
      current_step: d.current_step ?? d.progress_message,
    };
  },

  // Transcript
  getTranscript: async (id: string): Promise<TranscriptSegment[]> => {
    const response = await apiClient.get(`/api/lectures/${id}/transcript`);
    return response.data.transcript || response.data;
  },

  // Chat
  sendChatMessage: async (request: ChatRequest): Promise<ChatMessage> => {
    const response = await apiClient.post('/api/chat', request);
    // Backend returns {answer, sources, question, scope}
    // Transform to ChatMessage format
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.data.answer,
      sources: response.data.sources,
    };
  },

  // Quizzes
  getQuizzes: async (lectureId: string): Promise<Quiz[]> => {
    const response = await apiClient.get(`/api/lectures/${lectureId}/quizzes`);
    return response.data.quizzes || response.data;
  },

  generateQuiz: async (
    lectureId: string,
    questionsCount: number = 10
  ): Promise<Quiz> => {
    const response = await apiClient.post(
      `/api/lectures/${lectureId}/quizzes/generate`,
      { questions_count: questionsCount }
    );
    return response.data;
  },

  getQuiz: async (quizId: string): Promise<{
    id: string;
    lecture_id: string;
    questions: QuizQuestion[];
  }> => {
    const response = await apiClient.get(`/api/quizzes/${quizId}`);
    return response.data;
  },

  submitQuiz: async (
    quizId: string,
    answers: Record<string, string>
  ): Promise<QuizAttempt> => {
    const response = await apiClient.post(`/api/quizzes/${quizId}/attempts`, {
      answers,
    });
    return response.data;
  },

  getQuizAttempt: async (
    quizId: string,
    attemptId: string
  ): Promise<QuizAttempt> => {
    const response = await apiClient.get(
      `/api/quizzes/${quizId}/attempts/${attemptId}`
    );
    return response.data;
  },
};

export default api;
