import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { MainPage } from '@/pages/MainPage';
import { DetailPage } from '@/pages/DetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { WritePage } from '@/pages/WritePage';
import { EditPage } from '@/pages/EditPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { MyPage } from '@/pages/MyPage';
import { TestPage } from '@/pages/TestPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/post/:id" element={<DetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/test" element={<TestPage />} />
            
            {/* 보호된 라우트 */}
            <Route 
              path="/write" 
              element={
                <ProtectedRoute>
                  <WritePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mypage" 
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
