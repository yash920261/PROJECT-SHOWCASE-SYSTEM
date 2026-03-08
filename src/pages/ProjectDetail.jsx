import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users as UsersIcon, Server, ExternalLink, ThumbsUp, ThumbsDown, ShieldAlert, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ProjectDetail.css';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [userRole, setUserRole] = useState('student');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        setUserRole(user.user_metadata.role || 'student');
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`*, groups(id, name, leader_email)`)
        .eq('id', id)
        .single();
        
      if (projectError) throw projectError;
      setProject(projectData);

      if (projectData && projectData.groups) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', projectData.groups.id);
        setMembers(memberData || []);
      }
    } catch (err) {
      console.error('Error fetching project:', err.message);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      setIsVoting(true);
      const newStatus = voteType === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      alert(`Project successfully ${newStatus}!`);
      fetchProjectDetails(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="project-detail-page animate-fade-in">
      
      {/* Hero Image Header */}
      <div 
        className="project-hero" 
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${project.image_url || 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1200'})` }}
      >
        <div className="container project-hero-content">
          <Link to="/projects" className="back-link">
            <ArrowLeft size={18} /> Back to Projects
          </Link>
          
          <div className="project-badges">
            <span className="dept-badge">{project.department.toUpperCase()}</span>
            <span className={`status-badge ${project.status}`}>
              {project.status === 'pending' && <ShieldAlert size={14} />}
              {project.status.toUpperCase()}
            </span>
          </div>
          
          <h1 className="project-title">{project.title}</h1>
          <p className="project-group">Created by <strong>{project.groups?.name || 'Unknown'}</strong></p>
        </div>
      </div>

      <div className="container project-content-grid">
        
        {/* Main Content Area */}
        <div className="main-col">
          <div className="glass-panel detail-section">
            <h2>Project Overview</h2>
            <p className="description-text">{project.description}</p>
          </div>

          <div className="glass-panel detail-section">
            <h2 className="section-title"><Server size={20} /> Tech Stack</h2>
            <div className="tags">
              {project.tech_stack && project.tech_stack.map(tech => (
                <span key={tech} className="tag tag-large">{tech}</span>
              ))}
              {(!project.tech_stack || project.tech_stack.length === 0) && (
                <span className="text-muted">No tech stack specified.</span>
              )}
            </div>
          </div>
          
          {/* Faculty Voting Area (Conditional) */}
          {userRole === 'faculty' && project.status === 'pending' && (
            <div className="glass-panel voting-section">
              <div className="voting-header">
                <h2><ShieldAlert size={20} className="text-warning" /> Faculty Review Required</h2>
                <p>This project is awaiting approval. Your vote will determine if it is listed publicly.</p>
              </div>
              <div className="voting-actions">
                <button 
                  className="btn-success" 
                  onClick={() => handleVote('approve')}
                  disabled={isVoting}
                >
                  {isVoting ? <Loader size={18} className="animate-spin" /> : <ThumbsUp size={18} />} Approve Project
                </button>
                <button 
                  className="btn-danger" 
                  onClick={() => handleVote('reject')}
                  disabled={isVoting}
                >
                  {isVoting ? <Loader size={18} className="animate-spin" /> : <ThumbsDown size={18} />} Reject Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar-col">
          <div className="glass-panel detail-section sidebar-widget">
            <h2 className="section-title"><UsersIcon size={20} /> Team Members</h2>
            <div className="team-list">
              {members.length > 0 ? members.map(member => (
                <div key={member.id} className={`team-member ${member.student_email === project.groups?.leader_email ? 'leader' : ''}`}>
                  <div className="member-avatar">{member.student_name.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <p className="member-name">{member.student_name}</p>
                    <p className="member-role">{member.student_email === project.groups?.leader_email ? 'Team Leader' : 'Member'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-muted">No members listed.</p>
              )}
            </div>
          </div>

          <div className="glass-panel detail-section sidebar-widget">
            <h2 className="section-title">Actions</h2>
            <button className="btn-outline full-width">
              <ExternalLink size={18} /> View Source Code
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
