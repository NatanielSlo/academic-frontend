import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LectureList } from './pages/LectureList';
import { LectureDetailPage } from './pages/LectureDetailPage';
import { TranscriptPage } from './pages/TranscriptPage';
import { NotesPage } from './pages/NotesPage';
import { ChatPage } from './pages/ChatPage';
import { QuizListPage } from './pages/QuizListPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { QuizResultsPage } from './pages/QuizResultsPage';
import { ComprehensiveQuizPage } from './pages/ComprehensiveQuizPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LectureList />} />
          <Route path="/lectures/:id" element={<LectureDetailPage />} />
          <Route path="/lectures/:id/transcript" element={<TranscriptPage />} />
          <Route path="/lectures/:id/notes" element={<NotesPage />} />
          <Route path="/lectures/:id/quizzes" element={<QuizListPage />} />
          <Route
            path="/lectures/:id/comprehensive-quiz"
            element={<ComprehensiveQuizPage />}
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/quizzes/:id" element={<QuizTakingPage />} />
          <Route
            path="/quizzes/:quizId/attempts/:attemptId"
            element={<QuizResultsPage />}
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
