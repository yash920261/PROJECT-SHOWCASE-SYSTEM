import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Grid, Users, MessageSquare, Briefcase, Activity, ShieldCheck, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'student');
      }
    });

    // Listen for auth changes (login/logout from other components)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setRole(session.user.user_metadata?.role || 'student');
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Projects', path: '/projects', icon: Grid },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Forum', path: '/forum', icon: MessageSquare },
    { name: 'Faculty', path: '/faculty', icon: Briefcase },
    ...(role === 'faculty' ? [{ name: 'Voting', path: '/voting', icon: ShieldCheck }] : []),
    { name: 'Analytics', path: '/analytics', icon: Activity },
  ];

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <span className="brand-text-accent">PS</span>
          </div>
          <span className="brand-name">Showcase</span>
        </Link>
        
        <div className="nav-menu">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="user-profile">
              <span className="user-name" title={user.user_metadata?.name || user.email}>
                {user.user_metadata?.name || user.email.split('@')[0]}
              </span>
              <button onClick={handleLogout} className="btn-outline signout-btn" title="Sign Out">
                <LogOut size={16} /> <span className="signout-text">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary">
              <LogIn size={18} className="btn-icon" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
