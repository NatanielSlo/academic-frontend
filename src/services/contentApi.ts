import axios from 'axios';
import type {
  GenerationRequest,
  StatusResponse,
  NotesResponse,
  TranslationResponse,
  ComprehensiveQuizResponse,
  QuizSummary,
  QuizAttemptRequest,
  QuizAttemptResponse,
  CoverageReport,
} from '../types/content';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const contentApi = {
  // Generate notes only
  generateNotes: async (lectureId: string): Promise<StatusResponse> => {
    const response = await apiClient.post<StatusResponse>(
      `/api/content/lectures/${lectureId}/generate-notes`
    );
    return response.data;
  },

  // Generate quiz only
  generateQuiz: async (
    lectureId: string,
    numQuestions: number = 20
  ): Promise<StatusResponse> => {
    const response = await apiClient.post<StatusResponse>(
      `/api/content/lectures/${lectureId}/generate-quiz`,
      { num_quiz_questions: numQuestions }
    );
    return response.data;
  },

  // Start generation
  generateMaterials: async (
    lectureId: string,
    numQuestions: number = 20
  ): Promise<StatusResponse> => {
    const response = await apiClient.post<StatusResponse>(
      `/api/content/lectures/${lectureId}/generate`,
      { num_quiz_questions: numQuestions }
    );
    return response.data;
  },

  // Poll status
  getGenerationStatus: async (lectureId: string): Promise<StatusResponse> => {
    const response = await apiClient.get<StatusResponse>(
      `/api/content/lectures/${lectureId}/generation-status`
    );
    return response.data;
  },

  // Get notes
  getNotes: async (lectureId: string): Promise<NotesResponse> => {
    const response = await apiClient.get<NotesResponse>(
      `/api/content/lectures/${lectureId}/notes`
    );
    return response.data;
  },

  // Get the most recent quiz for a lecture
  getComprehensiveQuiz: async (
    lectureId: string
  ): Promise<ComprehensiveQuizResponse> => {
    const response = await apiClient.get<ComprehensiveQuizResponse>(
      `/api/content/lectures/${lectureId}/comprehensive-quiz`
    );
    return response.data;
  },

  // List all quizzes generated for a lecture (for the "Old Quizzes" view)
  getLectureQuizzes: async (lectureId: string): Promise<QuizSummary[]> => {
    const response = await apiClient.get<{ quizzes: QuizSummary[] }>(
      `/api/content/lectures/${lectureId}/quizzes`
    );
    return response.data.quizzes;
  },

  // Fetch a specific quiz by id (to retake it)
  getQuiz: async (quizId: string): Promise<ComprehensiveQuizResponse> => {
    const response = await apiClient.get<ComprehensiveQuizResponse>(
      `/api/content/quizzes/${quizId}`
    );
    return response.data;
  },

  // Submit a quiz attempt (saved to quiz_attempts)
  submitQuizAttempt: async (
    quizId: string,
    attempt: QuizAttemptRequest
  ): Promise<QuizAttemptResponse> => {
    const response = await apiClient.post<QuizAttemptResponse>(
      `/api/content/quizzes/${quizId}/attempts`,
      attempt
    );
    return response.data;
  },

  // Get coverage report
  getCoverageReport: async (lectureId: string): Promise<CoverageReport> => {
    const response = await apiClient.get<CoverageReport>(
      `/api/content/lectures/${lectureId}/coverage-report`
    );
    return response.data;
  },

  // Trigger notes translation
  translateNotes: async (lectureId: string, language: string): Promise<void> => {
    await apiClient.post(`/api/content/lectures/${lectureId}/notes/translate`, { language });
  },

  // Fetch a completed translation
  getNotesTranslation: async (lectureId: string, language: string): Promise<TranslationResponse> => {
    const response = await apiClient.get<TranslationResponse>(
      `/api/content/lectures/${lectureId}/notes/translation`,
      { params: { language } }
    );
    return response.data;
  },

  // Get all materials
  getAllMaterials: async (lectureId: string): Promise<any> => {
    const response = await apiClient.get(
      `/api/content/lectures/${lectureId}/all-materials`
    );
    return response.data;
  },
};

export default contentApi;
