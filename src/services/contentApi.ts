import axios from 'axios';
import type {
  GenerationRequest,
  StatusResponse,
  NotesResponse,
  TranslationResponse,
  ComprehensiveQuizResponse,
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

  // Get comprehensive quiz
  getComprehensiveQuiz: async (
    lectureId: string
  ): Promise<ComprehensiveQuizResponse> => {
    const response = await apiClient.get<ComprehensiveQuizResponse>(
      `/api/content/lectures/${lectureId}/comprehensive-quiz`
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
