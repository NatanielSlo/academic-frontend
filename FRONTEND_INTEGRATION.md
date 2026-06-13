# Frontend Integration Guide - Content Generation

## Overview

Nowa funkcjonalność: **Automatyczne generowanie materiałów edukacyjnych** z transkryptów wykładów.

**Co użytkownik dostaje:**
- 📋 Szczegółowe notatki w Markdown (10-20 stron)
- ❓ Quiz z 20+ pytaniami (różne typy i poziomy trudności)
- 📊 Raport jakości i pokrycia materiału

**Proces:** 2-3 minuty, ~$0.30 za wykład

## API Endpoints

Base URL: `http://localhost:8000` (dev) / `https://your-api.com` (prod)

### 1. Start Generation

```http
POST /api/content/lectures/{lecture_id}/generate
Content-Type: application/json

{
  "num_quiz_questions": 20
}
```

**Response:**
```json
{
  "lecture_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "not_started",
  "progress_percent": 0,
  "current_step": "Queued for processing"
}
```

**Requirements:**
- Wykład musi być przetworzony (`status: "completed"`)
- Transkrypt musi istnieć

### 2. Poll Status (co 5 sekund)

```http
GET /api/content/lectures/{lecture_id}/generation-status
```

**Response:**
```json
{
  "lecture_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "generating_notes",
  "progress_percent": 50,
  "current_step": "Saving detailed notes",
  "error_message": null
}
```

**Status progression:**
- `not_started` (0%)
- `generating_outline` (10-30%)
- `generating_notes` (30-50%)
- `generating_quiz` (50-70%)
- `verifying` (70-90%)
- `completed` (100%)
- `failed` (error occurred)

### 3. Get Notes

```http
GET /api/content/lectures/{lecture_id}/notes
```

**Response:**
```json
{
  "lecture_id": "550e8400-e29b-41d4-a716-446655440000",
  "notes_markdown": "# Lecture Title\n\n## Topic 1\n...",
  "generated_at": "2024-01-15T10:35:00Z"
}
```

**Usage:** Render with Markdown parser (react-markdown, marked, etc.)

### 4. Get Quiz

```http
GET /api/content/lectures/{lecture_id}/comprehensive-quiz
```

**Response:**
```json
{
  "lecture_id": "550e8400-e29b-41d4-a716-446655440000",
  "quiz_metadata": {
    "total_questions": 20,
    "topics_covered": ["Dynamic Programming", "Recursion"],
    "difficulty_distribution": {
      "basic": 6,
      "intermediate": 10,
      "advanced": 4
    }
  },
  "questions": [
    {
      "question_id": 1,
      "type": "multiple_choice",
      "difficulty": "intermediate",
      "topic": "Dynamic Programming",
      "question_text": "What is memoization?",
      "options": [
        {"label": "A", "text": "Storing function results"},
        {"label": "B", "text": "Recursive calls"},
        {"label": "C", "text": "Loop optimization"},
        {"label": "D", "text": "Memory allocation"}
      ],
      "correct_answer": "A",
      "explanation": "Memoization stores the results..."
    },
    {
      "question_id": 2,
      "type": "true_false",
      "difficulty": "basic",
      "topic": "Recursion",
      "question_text": "All recursive functions can be converted to iterative. True or False?",
      "correct_answer": "True",
      "explanation": "Any recursive algorithm can be..."
    }
  ],
  "generated_at": "2024-01-15T10:40:00Z"
}
```

**Question types:**
- `multiple_choice` - Ma `options` array
- `true_false` - Odpowiedź to "True" lub "False"
- `short_answer` - Ma `sample_answer` i `key_points`

### 5. Get Coverage Report

```http
GET /api/content/lectures/{lecture_id}/coverage-report
```

**Response:**
```json
{
  "lecture_id": "550e8400-e29b-41d4-a716-446655440000",
  "coverage_summary": {
    "coverage_percent": 95.5
  },
  "overall_assessment": {
    "coverage_percent": 95.5,
    "quality_score": "excellent",
    "ready_for_student_use": true
  },
  "gaps": [],
  "generated_at": "2024-01-15T10:45:00Z"
}
```

**Quality scores:** `excellent`, `good`, `fair`, `poor`

### 6. Get All Materials (Optional)

```http
GET /api/content/lectures/{lecture_id}/all-materials
```

Zwraca wszystko naraz (outline, notes, quiz, report). Użyj po zakończeniu generowania.

## React/TypeScript Example

### Types

```typescript
// types/content.ts

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
}

export interface QuizResponse {
  lecture_id: string;
  quiz_metadata: {
    total_questions: number;
    topics_covered: string[];
    difficulty_distribution: Record<string, number>;
  };
  questions: QuizQuestion[];
  generated_at: string;
}

export interface NotesResponse {
  lecture_id: string;
  notes_markdown: string;
  generated_at: string;
}
```

### API Service

```typescript
// services/contentApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function generateMaterials(
  lectureId: string,
  numQuestions: number = 20
): Promise<StatusResponse> {
  const response = await fetch(
    `${API_BASE}/api/content/lectures/${lectureId}/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_quiz_questions: numQuestions })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Generation failed');
  }
  
  return response.json();
}

export async function getGenerationStatus(
  lectureId: string
): Promise<StatusResponse> {
  const response = await fetch(
    `${API_BASE}/api/content/lectures/${lectureId}/generation-status`
  );
  return response.json();
}

export async function getNotes(lectureId: string): Promise<NotesResponse> {
  const response = await fetch(
    `${API_BASE}/api/content/lectures/${lectureId}/notes`
  );
  
  if (!response.ok) {
    throw new Error('Notes not found');
  }
  
  return response.json();
}

export async function getQuiz(lectureId: string): Promise<QuizResponse> {
  const response = await fetch(
    `${API_BASE}/api/content/lectures/${lectureId}/comprehensive-quiz`
  );
  
  if (!response.ok) {
    throw new Error('Quiz not found');
  }
  
  return response.json();
}
```

### Hook for Polling

```typescript
// hooks/useContentGeneration.ts

import { useState, useEffect, useCallback } from 'react';
import { generateMaterials, getGenerationStatus } from '@/services/contentApi';
import type { StatusResponse } from '@/types/content';

export function useContentGeneration(lectureId: string) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback(async (numQuestions: number = 20) => {
    try {
      setError(null);
      setIsGenerating(true);
      const result = await generateMaterials(lectureId, numQuestions);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      setIsGenerating(false);
    }
  }, [lectureId]);

  // Poll status while generating
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const newStatus = await getGenerationStatus(lectureId);
        setStatus(newStatus);

        if (newStatus.status === 'completed' || newStatus.status === 'failed') {
          setIsGenerating(false);
          if (newStatus.status === 'failed') {
            setError(newStatus.error_message || 'Generation failed');
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isGenerating, lectureId]);

  return {
    status,
    isGenerating,
    error,
    startGeneration
  };
}
```

### Component Example

```typescript
// components/MaterialsGenerator.tsx

import { useContentGeneration } from '@/hooks/useContentGeneration';
import { useRouter } from 'next/navigation';

interface Props {
  lectureId: string;
}

export function MaterialsGenerator({ lectureId }: Props) {
  const { status, isGenerating, error, startGeneration } = useContentGeneration(lectureId);
  const router = useRouter();

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Generate Study Materials</h2>
      
      {!isGenerating && !status && (
        <button
          onClick={() => startGeneration(20)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Generate Notes & Quiz
        </button>
      )}

      {isGenerating && status && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${status.progress_percent}%` }}
            />
          </div>

          {/* Status Text */}
          <div className="text-sm text-gray-600">
            <p className="font-medium">{status.status.replace(/_/g, ' ')}</p>
            {status.current_step && (
              <p className="text-gray-500">{status.current_step}</p>
            )}
            <p className="text-gray-400">{status.progress_percent}%</p>
          </div>
        </div>
      )}

      {status?.status === 'completed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Materials ready!</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/lectures/${lectureId}/notes`)}
              className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
            >
              View Notes
            </button>
            <button
              onClick={() => router.push(`/lectures/${lectureId}/quiz`)}
              className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
            >
              Take Quiz
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
```

### Notes Viewer Component

```typescript
// components/NotesViewer.tsx

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getNotes } from '@/services/contentApi';

interface Props {
  lectureId: string;
}

export function NotesViewer({ lectureId }: Props) {
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotes(lectureId)
      .then(data => setNotes(data.notes_markdown))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [lectureId]);

  if (loading) return <div>Loading notes...</div>;
  if (!notes) return <div>No notes available</div>;

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{notes}</ReactMarkdown>
    </div>
  );
}
```

### Quiz Component

```typescript
// components/QuizTaker.tsx

import { useEffect, useState } from 'react';
import { getQuiz } from '@/services/contentApi';
import type { QuizQuestion } from '@/types/content';

interface Props {
  lectureId: string;
}

export function QuizTaker({ lectureId }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    getQuiz(lectureId)
      .then(data => setQuestions(data.questions))
      .catch(err => console.error(err));
  }, [lectureId]);

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) return <div>Loading quiz...</div>;

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

  if (showResults) {
    const score = questions.filter(
      q => answers[q.question_id] === q.correct_answer
    ).length;

    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Quiz Complete!</h2>
        <p className="text-xl">
          Score: {score}/{questions.length} ({Math.round(score/questions.length*100)}%)
        </p>
        <button
          onClick={() => { setCurrentIndex(0); setShowResults(false); setAnswers({}); }}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="text-sm text-gray-600">
        Question {currentIndex + 1} of {questions.length}
      </div>

      {/* Question */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{currentQuestion.question_text}</h3>

        {/* Multiple Choice */}
        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-2">
            {currentQuestion.options?.map(option => (
              <button
                key={option.label}
                onClick={() => handleAnswer(option.label)}
                className={`w-full text-left p-4 border rounded ${
                  answers[currentQuestion.question_id] === option.label
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option.label}.</span> {option.text}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQuestion.type === 'true_false' && (
          <div className="space-y-2">
            {['True', 'False'].map(answer => (
              <button
                key={answer}
                onClick={() => handleAnswer(answer)}
                className={`w-full text-left p-4 border rounded ${
                  answers[currentQuestion.question_id] === answer
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={!answers[currentQuestion.question_id]}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-300"
      >
        {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
      </button>
    </div>
  );
}
```

## UI/UX Recommendations

### 1. Button Placement
Dodaj przycisk "Generate Materials" przy każdym przetworzonym wykładzie:
- Pokaż tylko gdy `lecture.status === "completed"`
- Ukryj gdy materiały już istnieją (sprawdź endpoint status)

### 2. Progress Visualization
```
Generating Study Materials...
████████████░░░░░░░░░░░░ 50%
Saving detailed notes...
```

### 3. Status Messages
```typescript
const statusLabels = {
  'not_started': 'Queued',
  'generating_outline': 'Analyzing lecture content...',
  'generating_notes': 'Writing detailed notes...',
  'generating_quiz': 'Creating quiz questions...',
  'verifying': 'Verifying quality...',
  'completed': 'Complete!',
  'failed': 'Failed'
};
```

### 4. Loading States
- Podczas generowania: Pokaż progress bar + status text
- Nie pozwól użytkownikowi opuścić strony (confirmation dialog)
- Po zakończeniu: Pokaż success message + CTA buttons

### 5. Error Handling
```typescript
if (status === 'failed') {
  // Show error message
  // Offer "Retry" button
  // Link to support/docs
}
```

## Error Cases to Handle

### 1. Lecture Not Processed
```json
{
  "detail": "Lecture must be fully processed before generating materials (current status: processing)"
}
```
**UI:** Disable button, show "Process lecture first"

### 2. No Transcript
```json
{
  "detail": "No transcript found for lecture {id}"
}
```
**UI:** Show error, suggest re-processing

### 3. Generation Failed
```json
{
  "status": "failed",
  "error_message": "LLM API error: timeout"
}
```
**UI:** Show error message, offer retry

### 4. Materials Not Found
```json
{
  "detail": "No notes found for lecture {id}. Generate materials first."
}
```
**UI:** Redirect to generation page

## Testing Checklist

- [ ] Start generation successfully
- [ ] Progress bar updates every 5 seconds
- [ ] Status text changes correctly
- [ ] Completion triggers success UI
- [ ] Notes render with Markdown
- [ ] Quiz questions display correctly
- [ ] Multiple choice works
- [ ] True/False works
- [ ] Error states show properly
- [ ] Retry button works after failure
- [ ] Can't start generation twice

## Performance Notes

- **Poll interval:** 5 seconds (don't go faster, backend updates every few seconds)
- **Timeout:** Generation takes 2-3 minutes, show patience message
- **Caching:** Cache notes/quiz once fetched (don't re-fetch on every visit)
- **Debounce:** Debounce retry button (prevent spam)

## Analytics Events (Optional)

Track these for insights:
```typescript
analytics.track('materials_generation_started', { lectureId, numQuestions });
analytics.track('materials_generation_completed', { lectureId, duration });
analytics.track('notes_viewed', { lectureId });
analytics.track('quiz_started', { lectureId });
analytics.track('quiz_completed', { lectureId, score });
```

## Questions?

- **API Docs:** `http://localhost:8000/docs`
- **Examples:** `backend/USAGE_EXAMPLE.md`
- **Full Spec:** `backend/CONTENT_GENERATION.md`

---

**Ready to integrate!** 🚀
