import { useState, useEffect } from 'react';
import { Briefcase, Mail, Award, BookOpen, Plus, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Faculty.css';

// Mock Data
const MOCK_FACULTY = [
  {
    id: 1,
    name: 'Dr. Alan Turing',
    department: 'Computer Science',
    specialization: 'Artificial Intelligence, Cryptography',
    experience: '15+ Years',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 2,
    name: 'Prof. Marie Curie',
    department: 'Electrical Engineering',
    specialization: 'Quantum Electronics, Radiophysics',
    experience: '20+ Years',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 3,
    name: 'Dr. Nikola Tesla',
    department: 'Electrical Engineering',
    specialization: 'Alternating Currents, Thermodynamics',
    experience: '18+ Years',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  }
];

export const Faculty = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', department: '', specialization: '', experience: ''
  });

  const [isFaculty, setIsFaculty] = useState(false);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.user_metadata?.role === 'faculty') {
      setIsFaculty(true);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    console.log('Adding faculty:', formData);
    setShowAddForm(false);
  };

  return (
    <div className="faculty-page container animate-fade-in">
      
      <div className="page-header flex-header">
        <div>
          <h1>Faculty Directory</h1>
          <p>Meet our esteemed project advisors and reviewers.</p>
        </div>
        {isFaculty && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Faculty
          </button>
        )}
      </div>

      {showAddForm && isFaculty && (
        <div className="add-faculty-modal animate-fade-in">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Add New Faculty Profile</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="faculty-form">
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" required 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label>Department</label>
                  <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                    <option value="">Select Department</option>
                    <option value="CS">Computer Science</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Years of Experience</label>
                  <input 
                    type="text" required placeholder="e.g. 10+ Years"
                    value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Areas of Specialization</label>
                <input 
                  type="text" required placeholder="e.g. AI, Machine Learning"
                  value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label>Upload CV (PDF)</label>
                <div className="upload-container">
                  <Upload size={24} className="text-primary mb-2" />
                  <span>Click to browse or drag file here</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="faculty-grid">
        {MOCK_FACULTY.map(person => (
          <div key={person.id} className="faculty-card glass-panel">
            <div className="faculty-cover"></div>
            <div className="faculty-avatar">
              <img src={person.avatar} alt={person.name} />
            </div>
            
            <div className="faculty-info">
              <h2>{person.name}</h2>
              <span className="faculty-dept">{person.department}</span>
              
              <div className="faculty-details">
                <div className="detail-item">
                  <BookOpen size={16} />
                  <span>{person.specialization}</span>
                </div>
                <div className="detail-item">
                  <Award size={16} />
                  <span>{person.experience} Experience</span>
                </div>
              </div>
            </div>
            
            <div className="faculty-footer">
              <button className="btn-outline full-width">
                <Mail size={16} /> Contact
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
