import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ThumbsUp, ThumbsDown, CheckCircle, ExternalLink, Activity, Loader, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Voting.css';

export const Voting = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFaculty, setIsFaculty] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || user.user_metadata?.role !== 'faculty') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      setIsFaculty(true);
      
      // Fetch pending projects
      const { data: pendingData, error: pendingError } = await supabase
        .from('projects')
        .select('*, groups(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (pendingError) throw pendingError;
      setProjects(pendingData || []);

      // Fetch recently voted (approved/rejected)
      const { data: historyData, error: historyError } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (err) {
      console.error('Error fetching voting data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, voteType) => {
    setIsProcessing(id);
    try {
      const newStatus = voteType === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      checkAccessAndFetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to process vote: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = projects.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container flex flex-col justify-center items-center min-h-[70vh] animate-fade-in text-center">
        <Lock size={64} className="text-danger mb-4" />
        <h1 className="mb-2">Access Denied</h1>
        <p className="text-muted mb-6">This terminal is strictly restricted to Faculty members for project voting.</p>
        <Link to="/" className="btn-primary">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="voting-page container animate-fade-in">
      
      <div className="page-header flex-header">
        <div>
          <h1>Faculty Voting Terminal</h1>
          <p>Review pending student projects and record your vote on the blockchain.</p>
        </div>
        <div className="blockchain-status">
          <Activity size={18} className="text-success animate-pulse" />
          <span>Connected to Network</span>
        </div>
      </div>

      <div className="voting-dashboard">
        {pendingCount === 0 ? (
          <div className="glass-panel text-center p-5 empty-state">
            <CheckCircle size={48} className="text-success mb-3" />
            <h2>All Caught Up!</h2>
            <p className="text-muted">There are no pending projects requiring your review at this time.</p>
          </div>
        ) : (
          <div className="pending-list">
            <h2 className="section-title">
              Pending Reviews <span className="badge">{pendingCount}</span>
            </h2>
            
            <div className="voting-grid">
              {projects.map(project => (
                <div key={project.id} className="voting-card glass-panel">
                  
                  <div className="card-header">
                    <span className="dept-badge">{project.department.toUpperCase()}</span>
                    <span className="submission-time">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="card-body">
                    <h3>{project.title}</h3>
                    <p className="group">By {project.groups?.name || 'Unknown'}</p>
                    <p className="description">{project.description}</p>
                    <div className="tags mt-3">
                      {project.tech_stack && project.tech_stack.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="card-footer blockchain-actions">
                    <Link to={`/project/${project.id}`} className="btn-outline">
                      <ExternalLink size={16} /> full details
                    </Link>
                    
                    <div className="vote-buttons">
                      <button 
                        className="btn-success icon-btn" 
                        onClick={() => handleVote(project.id, 'approve')}
                        disabled={isProcessing === project.id}
                        title="Approve Transaction"
                      >
                        {isProcessing === project.id ? <Activity className="animate-spin" /> : <ThumbsUp size={18} />}
                      </button>
                      
                      <button 
                        className="btn-danger icon-btn" 
                        onClick={() => handleVote(project.id, 'reject')}
                        disabled={isProcessing === project.id}
                        title="Reject Transaction"
                      >
                        {isProcessing === project.id ? <Activity className="animate-spin" /> : <ThumbsDown size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {isProcessing === project.id && (
                    <div className="processing-overlay">
                      <ShieldCheck size={32} className="text-primary animate-pulse mb-2" />
                      <p>Signing transaction...</p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        <div className="voting-history glass-panel">
          <h3>Your Recent Votes</h3>
          <ul className="history-list">
            {history.map(project => (
              <li key={`history-${project.id}`} className="history-item">
                <div className="history-info">
                  <span className={`status-dot ${project.status}`}></span>
                  <div className="history-text">
                    <strong>{project.title}</strong>
                    <span>Txn: 0x{Math.random().toString(16).substring(2, 10)}...</span>
                  </div>
                </div>
                <span className={`history-label ${project.status}`}>{project.status.toUpperCase()}</span>
              </li>
            ))}
            {history.length === 0 && (
              <li className="history-item text-muted">No recent votes recorded on this chain.</li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
};
