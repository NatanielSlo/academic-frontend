# Frontend Specification: AI Academic Assistant

## Project Overview
A single-page React application for processing TUM lecture recordings and studying with AI-powered tools. The app provides lecture transcription, AI question answering, and quiz generation for personal academic use.

## Tech Stack
- **Framework:** React 18+ with Vite
- **Language:** JavaScript or TypeScript (recommend TypeScript for better DX)
- **Styling:** Your choice (Tailwind CSS recommended for rapid development)
- **HTTP Client:** Axios or Fetch API
- **Routing:** React Router (for /lectures, /chat, /quiz routes)
- **State Management:** React Context or Zustand (keep it simple)
- **UI Components:** Optional - Headless UI, Radix UI, or shadcn/ui for accessible components

## Hosting
- **Development:** Local (npm run dev)
- **Production:** Vercel (connects to backend API on Render)

## Backend API Base URL
- **Development:** `http://localhost:8000`
- **Production:** `https://your-backend.onrender.com`

Store as environment variable: `VITE_API_BASE_URL`

## Pages & Features

### 1. Lecture List Page (`/`)
**Purpose:** Main landing page showing all lectures and processing status.

**Components:**
- Header with app title "AI Academic Assistant"
- "Add Lecture" button (opens modal/form)
- Lecture cards grid/list showing:
  - Course name (if provided)
  - Lecture number (if provided)
  - Date (if provided)
  - Processing status badge
  - Progress bar (if currently processing)
  - Click to view transcript/quiz

**API Calls:**
- `GET /api/lectures` - fetch on page load, poll every 10 seconds if any lecture is processing
- `GET /api/lectures/{id}/status` - poll every 5 seconds for lectures in 'processing' state

**Status Display:**
- **Processing:** Show progress bar with percentage and current step ("Downloading...", "Transcribing 45%...", "Embedding...")
- **Completed:** Green checkmark, show "View Transcript" and "Generate Quiz" buttons
- **Failed:** Red X, show error message

**Mock UI:**
```
┌─────────────────────────────────────┐
│  AI Academic Assistant         [+]  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ EIDI - Lecture 5            │   │
│  │ 2024-11-15                  │   │
│  │ ████████░░ Transcribing 80% │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ EIDI - Lecture 4      ✓     │   │
│  │ 2024-11-08                  │   │
│  │ [View Transcript] [Quiz]    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2. Add Lecture Modal/Form
**Trigger:** Click "[+]" button from lecture list

**Form Fields:**
- **URL** (required, text input)
  - Placeholder: "https://live.rbg.tum.de/w/eidi/20838"
  - Validation: Must start with `https://live.rbg.tum.de/`
- **Course Name** (optional, text input)
- **Lecture Number** (optional, text/number input)
- **Date** (optional, date picker)

**Submit Behavior:**
- POST to `/api/lectures`
- On success: Close modal, navigate to lecture list, show new lecture card with "processing" status
- On error: Show error message in form

### 3. Transcript Page (`/lectures/{id}/transcript`)
**Purpose:** Display full lecture transcript with clickable timestamps.

**Components:**
- Back button to lecture list
- Lecture metadata header (course name, number, date)
- Transcript viewer with timestamps
- Each timestamp is clickable and opens lecture URL with `?t=XmYs` parameter

**API Calls:**
- `GET /api/lectures/{id}/transcript` - fetch on page load

**Transcript Display:**
```
┌─────────────────────────────────────┐
│  ← Back to Lectures                 │
├─────────────────────────────────────┤
│  EIDI - Lecture 5 | 2024-11-15      │
├─────────────────────────────────────┤
│  [00:00:45] Today we'll cover       │
│  dynamic programming...              │
│                                      │
│  [00:01:30] Let's start with the    │
│  Fibonacci example...                │
│                                      │
│  [00:03:15] The key insight is...   │
└─────────────────────────────────────┘
```

**Timestamp Click Behavior:**
- Opens lecture URL in new tab: `https://live.rbg.tum.de/w/eidi/20838?t=1m30s`

### 4. Chat/Q&A Page (`/chat`)
**Purpose:** Ask questions about lectures using RAG.

**Components:**
- Scope selector (dropdown/radio buttons):
  - "All Lectures" (global search)
  - "Specific Course" (dropdown to select course)
  - "Specific Lecture" (dropdown to select lecture)
- Chat interface:
  - Message history (question + answer pairs)
  - Input box for new question
  - Send button
  - Loading indicator while waiting for response

**API Calls:**
- `POST /api/chat` with `{question, scope, scope_id}`
- Stream or poll for response (depending on backend implementation)

**Display:**
- User questions aligned right
- AI answers aligned left with sources below
- Sources show: lecture name, timestamp (clickable)

**Mock UI:**
```
┌─────────────────────────────────────┐
│  Scope: [All Lectures ▼]            │
├─────────────────────────────────────┤
│                                      │
│  What is dynamic programming?       │
│                              [User]  │
│                                      │
│  [AI] Dynamic programming is a      │
│  method for solving...              │
│  Sources:                           │
│  • EIDI Lecture 5 - 00:15:30        │
│  • EIDI Lecture 6 - 00:08:45        │
│                                      │
│  [Type your question...]      [Send]│
└─────────────────────────────────────┘
```

### 5. Quiz List Page (`/lectures/{id}/quizzes`)
**Purpose:** Show all quizzes generated for a specific lecture.

**Components:**
- Back button to lecture view
- "Generate New Quiz" button
- List of existing quizzes with:
  - Creation date
  - Number of questions
  - Best score
  - Number of attempts
  - "Take Quiz" button

**API Calls:**
- `GET /api/lectures/{id}/quizzes` - fetch on page load
- `POST /api/lectures/{id}/quizzes/generate` - when generating new quiz

**Generate New Quiz Flow:**
- Click "Generate New Quiz"
- Show modal with "Number of questions" input (default: 10)
- Show loading state ("Generating quiz...")
- On completion: Navigate to quiz taking page

### 6. Quiz Taking Page (`/quizzes/{id}`)
**Purpose:** Take a quiz (multiple choice questions).

**Components:**
- Quiz header (lecture name, question count)
- Progress indicator (Question 3 of 10)
- Question display with 4 options (A, B, C, D)
- Radio buttons for selection
- "Previous" and "Next" buttons
- "Submit Quiz" button (enabled only when all questions answered)

**API Calls:**
- `GET /api/quizzes/{id}` - fetch quiz on page load (no correct answers included)
- `POST /api/quizzes/{id}/attempts` - submit when user clicks "Submit"

**Navigation:**
- Can navigate back/forth between questions
- Selections are preserved
- "Submit" only enabled when all questions have answers

**Mock UI:**
```
┌─────────────────────────────────────┐
│  EIDI Lecture 5 Quiz                │
│  Question 3 of 10                   │
├─────────────────────────────────────┤
│  What is the time complexity of     │
│  the optimal Fibonacci solution?    │
│                                      │
│  ○ A. O(n)                          │
│  ● B. O(n²)                         │
│  ○ C. O(log n)                      │
│  ○ D. O(1)                          │
│                                      │
│  [← Previous]       [Next →]        │
│                    [Submit Quiz]    │
└─────────────────────────────────────┘
```

### 7. Quiz Results Page (`/quizzes/{id}/attempts/{attempt_id}`)
**Purpose:** Show quiz results after submission.

**Components:**
- Score summary (8/10, 80%)
- List of all questions with:
  - Question text
  - User's answer (marked correct ✓ or wrong ✗)
  - Correct answer (if user was wrong)
  - Explanation/context from lecture
- "Retake Quiz" button
- "Back to Quizzes" button

**API Calls:**
- Response from `POST /api/quizzes/{id}/attempts` already contains full results

**Mock UI:**
```
┌─────────────────────────────────────┐
│  Quiz Results: 8/10 (80%)           │
├─────────────────────────────────────┤
│  ✓ Q1: What is dynamic programming? │
│     Your answer: B (Correct)        │
│                                      │
│  ✗ Q2: What is the time complexity? │
│     Your answer: A                  │
│     Correct answer: B               │
│     Explanation: The lecture at     │
│     00:15:30 explains...            │
│                                      │
│  [Retake Quiz] [Back to Quizzes]    │
└─────────────────────────────────────┘
```

## State Management Recommendations

**Global State (Context/Zustand):**
- Lecture list
- Currently processing lectures (for polling)
- API base URL
- Loading states

**Local State (useState):**
- Form inputs
- Quiz answers
- Current question index
- Chat messages

## Polling Strategy

**Active Polling Scenarios:**
1. **Lecture list page:** If any lecture has `status: "processing"`, poll `GET /api/lectures/{id}/status` every 5 seconds
2. **Stop polling:** When all lectures reach `status: "completed"` or `status: "failed"`

**Implementation Tip:**
Use `useEffect` with `setInterval` and cleanup:
```javascript
useEffect(() => {
  if (hasProcessingLectures) {
    const interval = setInterval(() => {
      fetchLectureStatus(lectureId);
    }, 5000);
    return () => clearInterval(interval);
  }
}, [hasProcessingLectures]);
```

## API Error Handling
- Network errors: Show toast/notification "Failed to connect to server"
- 4xx errors: Show specific error message from backend
- 5xx errors: Show "Server error, please try again"
- Loading states: Show spinners/skeletons during API calls

## Responsive Design
- Mobile-first approach
- Lecture cards: Stack vertically on mobile, grid on desktop
- Chat interface: Full width on mobile, max-width on desktop
- Quiz: Full-screen on mobile, centered card on desktop

## Accessibility
- Semantic HTML (button, nav, main, article)
- Keyboard navigation support
- ARIA labels for interactive elements
- Focus management in modals
- Color contrast for status indicators

## Performance Optimizations
- Lazy load routes with React.lazy()
- Debounce chat input (avoid sending on every keystroke)
- Cache lecture list to avoid unnecessary refetches
- Virtualize long transcript lists if needed (react-window)

## Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

For production (Vercel), set in dashboard:
```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Project Structure
```
src/
├── components/
│   ├── LectureCard.jsx
│   ├── LectureForm.jsx
│   ├── TranscriptViewer.jsx
│   ├── ChatInterface.jsx
│   ├── QuizCard.jsx
│   ├── QuizQuestion.jsx
│   └── QuizResults.jsx
├── pages/
│   ├── LectureList.jsx
│   ├── TranscriptPage.jsx
│   ├── ChatPage.jsx
│   ├── QuizListPage.jsx
│   ├── QuizTakingPage.jsx
│   └── QuizResultsPage.jsx
├── services/
│   └── api.js (all API calls)
├── context/
│   └── AppContext.jsx (global state)
├── App.jsx (router setup)
└── main.jsx
```

## API Service Example
```javascript
// services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const api = {
  getLectures: () => 
    fetch(`${API_BASE}/api/lectures`).then(r => r.json()),
  
  addLecture: (data) =>
    fetch(`${API_BASE}/api/lectures`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  getLectureStatus: (id) =>
    fetch(`${API_BASE}/api/lectures/${id}/status`).then(r => r.json()),
  
  // ... other endpoints
};
```

## Testing Strategy
- Component tests: React Testing Library
- API mocking: MSW (Mock Service Worker)
- E2E tests (optional): Playwright or Cypress
- Manual testing: Process a real lecture, verify all flows

## Deployment to Vercel
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variable: `VITE_API_BASE_URL`
4. Deploy (auto-deploys on push to main branch)
5. Configure CORS on backend to allow Vercel domain

## Next Steps for Frontend Developer
1. Set up Vite + React project (`npm create vite@latest`)
2. Install dependencies (react-router-dom, axios, etc.)
3. Create API service layer
4. Build lecture list page with add lecture form
5. Implement polling for processing status
6. Build transcript viewer
7. Create chat interface
8. Implement quiz flow (list → take → results)
9. Add styling (Tailwind CSS or preferred framework)
10. Test locally with backend running on localhost:8000
11. Deploy to Vercel and test with production backend

## Design Tips
- Keep UI clean and academic-focused (not too playful)
- Use monospace font for code snippets in transcripts
- Color coding: Blue for info, Green for success, Red for errors, Yellow for processing
- Dark mode optional but nice to have for late-night studying
- Consider adding keyboard shortcuts (e.g., 'n' for next question in quiz)
