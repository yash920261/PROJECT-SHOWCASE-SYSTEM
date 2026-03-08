import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Projects.css';

export const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState('All');
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const departments = ['All', 'cs', 'ee', 'me', 'ce', 'it'];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*, groups(name)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.groups?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = activeDept === 'All' || project.department.toLowerCase() === activeDept.toLowerCase();
    return matchesSearch && matchesDept;
  });

  return (
    <div className="projects-page animate-fade-in container">
      
      <div className="projects-header">
        <div>
          <h1 className="page-title">Discover Projects</h1>
          <p className="page-subtitle">Explore verified student innovations across all departments.</p>
        </div>
        <Link to="/submit-project" className="btn-primary">
          <Plus size={18} /> Submit Project
        </Link>
      </div>

      <div className="projects-controls glass-panel">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects or groups..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} className="filter-icon" />
          <div className="department-filters">
            {departments.map(dept => (
              <button 
                key={dept}
                className={`filter-btn ${activeDept === dept ? 'active' : ''}`}
                onClick={() => setActiveDept(dept)}
              >
                {dept.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={48} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card glass-panel">
              <div className="card-header">
                <span className="dept-badge">{project.department.toUpperCase()}</span>
              </div>
              <div className="card-body">
                <h3>{project.title}</h3>
                <p className="group">By {project.groups?.name || 'Unknown Group'}</p>
                <div className="tags">
                  {project.tech_stack && project.tech_stack.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="card-footer">
                <Link to={`/project/${project.id}`} className="btn-outline">
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="no-results">
              <p>No projects found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
