import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from './components/auth/AuthGuard';
import AuthPage from './pages/AuthPage';
import BusinessOnboarding from './components/onboarding/BusinessOnboarding';
import ProfilePage from './pages/Profile';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';
import LeadGenerationPage from './pages/LeadGenerationPage';
import NotionTemplatesPage from './pages/NotionTemplatesPage';
import NotionTemplateDetailPage from './pages/NotionTemplateDetailPage';
import AdminNotionTemplateUpload from './pages/AdminNotionTemplateUpload';

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          <Route
            path="/auth"
            element={
              <AuthGuard>
                <AuthPage />
              </AuthGuard>
            }
          />
          
          <Route 
            path="/onboarding"
            element={
              <AuthGuard>
                <BusinessOnboarding />
              </AuthGuard>
            } 
          />
          
          <Route 
            path="/home"
            element={
              <AuthGuard>
                <HomePage />
              </AuthGuard>
            }
          />
          
          <Route 
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />

          <Route 
            path="/lead-generation"
            element={
              <AuthGuard>
                <LeadGenerationPage />
              </AuthGuard>
            }
          />

          <Route 
            path="/notion-templates"
            element={
              <AuthGuard>
                <NotionTemplatesPage />
              </AuthGuard>
            }
          />

          <Route 
            path="/notion-templates/:template_id"
            element={
              <AuthGuard>
                <NotionTemplateDetailPage />
              </AuthGuard>
            }
          />

          <Route 
            path="/admin/notion-template-upload"
            element={
              <AuthGuard>
                <AdminNotionTemplateUpload />
              </AuthGuard>
            }
          />

          <Route 
            path="/"
            element={
              <AuthGuard>
                {/* This will be protected. AuthGuard decides where to go. */}
                {/* By default, let's aim for profile, guard will redirect if needed. */}
                <Navigate to="/home" replace />
              </AuthGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;
