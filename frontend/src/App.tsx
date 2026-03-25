import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import UploadPage from "@/pages/UploadPage";
import QuestionnairePage from "@/pages/QuestionnairePage";
import ProcessingPage from "@/pages/ProcessingPage";
import ResultsPage from "@/pages/ResultsPage";
import RoadmapStartPage from "@/pages/RoadmapStartPage";
import QuizPage from "@/pages/QuizPage";
import DiagnosisPage from "@/pages/DiagnosisPage";
import RoadmapPage from "@/pages/RoadmapPage";
import CoachHomePage from "@/pages/CoachHomePage";
import CoachSessionPage from "@/pages/CoachSessionPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/roadmap/start" element={<RoadmapStartPage />} />
          <Route path="/roadmap/quiz/:quizId" element={<QuizPage />} />
          <Route path="/roadmap/diagnosis/:quizId" element={<DiagnosisPage />} />
          <Route path="/roadmap/:roadmapId" element={<RoadmapPage />} />
          <Route path="/coach" element={<CoachHomePage />} />
          <Route path="/coach/session/:sessionId" element={<CoachSessionPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
