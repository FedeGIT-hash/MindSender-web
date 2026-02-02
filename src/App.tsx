import { lazy, ReactNode, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
const Register = lazy(() => import('./pages/Register'));
import Login from './pages/Login';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/register"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Register />
                </Suspense>
              }
            />
            <Route path="/verify" element={<Verify />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
