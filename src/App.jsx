import { useState, useEffect } from 'react';
import ExpenseTracker from './ExpenseTracker';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user, token) => {
    setIsAuthenticated(true);
  };

  const handleSignup = (user, token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <Login
        onLogin={handleLogin}
        onSwitchToSignup={() => setShowLogin(false)}
      />
    ) : (
      <Signup
        onSignup={handleSignup}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  return <ExpenseTracker onLogout={handleLogout} />;
}

export default App;
