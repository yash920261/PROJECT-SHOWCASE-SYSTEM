import { useState } from 'react';
import { Mail, Lock, User, Briefcase, GraduationCap, ArrowRight, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student or faculty
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // Handle Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        console.log('Logged in user:', data.user);
        navigate('/'); // Redirect to home
        
      } else {
        // Handle Registration
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: role,
              department: role === 'faculty' ? formData.department : null
            }
          }
        });
        
        if (error) throw error;
        
        console.log('Registered user:', data.user);
        alert('Registration successful! Please sign in.');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Auth Error:', error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to access your dashboard' : 'Join the College Innovation Platform'}</p>
        </div>

        {errorMsg && (
          <div className="auth-error-msg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          
          {/* Role Selection (Only Register) */}
          {!isLogin && (
            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
              >
                <GraduationCap size={18} /> Student
              </button>
              <button 
                type="button" 
                className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
                onClick={() => setRole('faculty')}
              >
                <Briefcase size={18} /> Faculty
              </button>
            </div>
          )}

          {/* Name Field (Only Register) */}
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="input-group">
            <label>College Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="john.doe@college.edu" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
          </div>

          {/* Department Field (Faculty Only Registration) */}
          {!isLogin && role === 'faculty' && (
            <div className="input-group">
              <label>Department</label>
              <div className="input-wrapper">
                <Briefcase size={18} className="input-icon" />
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  <option value="" disabled>Select Department</option>
                  <option value="CS">Computer Science</option>
                  <option value="EE">Electrical Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                </select>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
          </div>

          {/* Forgot Password Link (Only Login) */}
          {isLogin && (
            <div className="forgot-password">
              <a href="#reset">Forgot Password?</a>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <Loader size={18} className="animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="text-btn" onClick={toggleMode} type="button">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
