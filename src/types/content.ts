export interface GenerationRequest {
  num_quiz_questions: number;
}

export type GenerationStatus =
  | 'not_started'
  | 'generating_outline'
  | 'generating_notes'
  | 'generating_quiz'
  | 'verifying'
  | 'completed'
  | 'failed';

export interface StatusResponse {
  lecture_id: string;
  status: GenerationStatus;
  progress_percent: number;
  current_step?: string;
  error_message?: string;
}

export interface QuizQuestion {
  question_id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
  question_text: string;
  options?: Array<{ label: string; text: string }>;
  correct_answer: string;
  explanation: string;
  sample_answer?: string;
  key_points?: string[];
}

export interface QuizMetadata {
  total_questions: number;
  topics_covered: string[];
  difficulty_distribution: {
    basic?: number;
    intermediate?: number;
    advanced?: number;
  };
}

export interface ComprehensiveQuizResponse {
  lecture_id: string;
  quiz_metadata: QuizMetadata;
  questions: QuizQuestion[];
  generated_at: string;
}

export interface NotesResponse {
  lecture_id: string;
  notes_markdown: string;
  generated_at: string;
}

export interface CoverageReport {
  lecture_id: string;
  coverage_summary: {
    coverage_percent: number;
  };
  overall_assessment: {
    coverage_percent: number;
    quality_score: 'excellent' | 'good' | 'fair' | 'poor';
    ready_for_student_use: boolean;
  };
  gaps: any[];
  generated_at: string;
}
