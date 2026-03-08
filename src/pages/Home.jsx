import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Lightbulb, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Home.css';

export const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*, groups(name)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) throw error;
        setFeaturedProjects(data || []);
      } catch (err) {
        console.error('Error fetching featured projects:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-page animate-fade-in">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="badge">College Innovation Platform</div>
            <h1 className="hero-title">
              Showcase Your <span className="text-gradient">Academic Excellence</span>
            </h1>
            <p className="hero-subtitle">
              A secure, blockchain-verified platform for students to submit, discuss, 
              and showcase their final year projects to faculty and peers.
            </p>
            <div className="hero-actions">
              <Link to="/submit-project" className="btn-primary">
                Submit Project <ArrowRight size={18} />
              </Link>
              <Link to="/projects" className="btn-secondary">
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section container">
        <div className="feature-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon"><Lightbulb size={24} /></div>
            <h3>Discover Innovation</h3>
            <p>Explore a curated gallery of approved projects from various departments across the college.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><ShieldCheck size={24} /></div>
            <h3>Faculty Verified</h3>
            <p>Every project undergoes a rigorous review process and is approved via a secure blockchain voting system.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><Users size={24} /></div>
            <h3>Collaborate & Discuss</h3>
            <p>Join group discussions, ask questions on the forum, and collaborate with peers on bleeding-edge tech.</p>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="featured-section container">
        <div className="section-header">
          <h2>Featured Approved Projects</h2>
          <Link to="/projects" className="view-all-link">
            View All Projects <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={48} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="projects-grid">
            {featuredProjects.map(project => (
              <div key={project.id} className="project-card glass-panel">
                <div className="project-image">
                  <img src={project.image_url || 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=800'} alt={project.title} />
                  <span className="dept-badge">{project.department.toUpperCase()}</span>
                </div>
                <div className="project-content">
                  <h3>{project.title}</h3>
                  <p className="group-name">By {project.groups?.name || 'Unknown'}</p>
                  <p className="project-desc">{project.description}</p>
                  
                  <div className="project-tags">
                    {project.tech_stack && project.tech_stack.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="project-footer">
                  <Link to={`/project/${project.id}`} className="btn-outline">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
            {featuredProjects.length === 0 && (
              <p className="text-muted text-center w-full py-8">No featured projects currently available.</p>
            )}
          </div>
        )}
      </section>

    </div>
  );
};
