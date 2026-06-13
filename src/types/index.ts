export interface Lecture {
  id: string;
  url: string;
  course_name?: string;
  lecture_number?: string;
  date?: string;
  status:
    | 'pending'
    | 'processing'
    | 'downloading'
    | 'transcribing'
    | 'embedding'
    | 'completed'
    | 'failed';
  progress?: number;
  current_step?: string;
  error_message?: string;
  created_at: string;
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  start_seconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
}

export interface ChatSource {
  lecture_id: string;
  lecture_name: string;
  timestamp: string;
  start_seconds: number;
}

export interface Quiz {
  id: string;
  lecture_id: string;
  created_at: string;
  questions_count: number;
  best_score?: number;
  attempts_count: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer?: string;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  submitted_at: string;
  answers: QuizAnswerResult[];
}

export interface QuizAnswerResult {
  question_id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
}

export type ChatScope = 'global' | 'course' | 'lecture';

export interface ChatRequest {
  question: string;
  scope: ChatScope;
  scope_id?: string;
}
