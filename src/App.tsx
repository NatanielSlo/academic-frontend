import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LectureList } from './pages/LectureList';
import { TranscriptPage } from './pages/TranscriptPage';
import { ChatPage } from './pages/ChatPage';
import { QuizListPage } from './pages/QuizListPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { QuizResultsPage } from './pages/QuizResultsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LectureList />} />
          <Route path="/lectures/:id/transcript" element={<TranscriptPage />} />
          <Route path="/lectures/:id/quizzes" element={<QuizListPage />} />
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
