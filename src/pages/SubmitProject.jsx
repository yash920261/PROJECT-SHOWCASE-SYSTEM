import { useState } from 'react';
import { Upload, Plus, X, Server, Layout, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './SubmitProject.css';

export const SubmitProject = () => {
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    groupName: '',
    department: 'cs',
    description: '',
    leaderEmail: '',
    studentNames: '',
    rollNumbers: '',
  });

  const handleAddTag = (e) => {
    e.preventDefault();
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in to submit a project');

      // Create Group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.groupName,
          leader_email: formData.leaderEmail,
          student_key: Math.random().toString(36).substring(2, 8).toUpperCase()
        })
        .select()
        .single();
        
      if (groupError) throw groupError;

      // Add members
      const studentNamesArr = formData.studentNames.split(',').map(n => n.trim());
      const rollNumbersArr = formData.rollNumbers.split(',').map(n => n.trim());
      
      const membersToInsert = studentNamesArr.map((name, i) => ({
        group_id: groupData.id,
        student_email: formData.leaderEmail, // For simplicity using leader email
        student_name: name,
        roll_number: rollNumbersArr[i] || 'N/A'
      }));

      if (membersToInsert.length > 0) {
        await supabase.from('group_members').insert(membersToInsert);
      }

      // Add Project
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          group_id: groupData.id,
          tech_stack: tags,
          status: 'pending',
          submitted_by: user.id
        });

      if (projectError) throw projectError;
      
      alert('Project Submitted Successfully! Awaiting Faculty Approval.');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-page container animate-fade-in">
      <div className="submit-header">
        <h1>Submit Your Project</h1>
        <p>Fill out the details below. Pending projects require faculty approval before going public.</p>
      </div>

      <div className="submit-form-container glass-panel">
        <form onSubmit={handleSubmit} className="submit-form">
          
          <div className="form-section">
            <h3 className="section-title"><Layout size={18} /> Basic Information</h3>
            
            <div className="form-row">
              <div className="input-group">
                <label>Project Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Autonomous Drone Navigation" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Department *</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  <option value="cs">Computer Science (CS)</option>
                  <option value="ee">Electrical Engineering (EE)</option>
                  <option value="me">Mechanical Engineering (ME)</option>
                  <option value="ce">Civil Engineering (CE)</option>
                  <option value="it">Information Technology (IT)</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Project Description *</label>
              <textarea 
                rows="4" 
                placeholder="Explain the problem you are solving and your approach..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              ></textarea>
            </div>
          </div>

          <div className="form-section divider">
            <h3 className="section-title"><Server size={18} /> Technical Details</h3>
            
            <div className="input-group">
              <label>Tech Stack</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="tag tag-removable">
                      {tag} <X size={14} onClick={() => removeTag(tag)} className="remove-icon" />
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input 
                    type="text" 
                    placeholder="Add a technology..." 
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                  />
                  <button type="button" className="btn-secondary add-tag-btn" onClick={handleAddTag}>
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Concept Image *</label>
              <div className="upload-area">
                <ImageIcon size={32} className="upload-icon-large" />
                <p>Drag and drop an image, or <span>browse</span></p>
                <p className="upload-hint">Supports: JPG, PNG, WEBP (Max 5MB)</p>
                <input type="file" className="file-input" accept="image/*" />
              </div>
            </div>
          </div>

          <div className="form-section divider">
            <h3 className="section-title"><Layout size={18} /> Group Details</h3>
            
            <div className="form-row">
              <div className="input-group">
                <label>Group Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. CodeCrafters" 
                  value={formData.groupName}
                  onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Team Leader Email *</label>
                <input 
                  type="email" 
                  placeholder="leader@college.edu" 
                  value={formData.leaderEmail}
                  onChange={(e) => setFormData({...formData, leaderEmail: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Student Names (Comma separated) *</label>
                <input 
                  type="text" 
                  placeholder="John Doe, Jane Smith" 
                  value={formData.studentNames}
                  onChange={(e) => setFormData({...formData, studentNames: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Roll Numbers (Comma separated) *</label>
                <input 
                  type="text" 
                  placeholder="CS101, CS102" 
                  value={formData.rollNumbers}
                  onChange={(e) => setFormData({...formData, rollNumbers: e.target.value})}
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : <><Upload size={18} /> Submit for Approval</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
