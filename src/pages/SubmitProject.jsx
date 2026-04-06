import { useState, useEffect } from 'react';
import { Upload, Plus, X, Server, Layout, Image as ImageIcon, Users, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './SubmitProject.css';

export const SubmitProject = () => {
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    department: 'cs',
    description: '',
  });

  // Fetch user's groups on mount
  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoadingGroups(false);
        return;
      }

      // Find all groups the user is a member of
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_email', user.email);

      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);

        // Fetch groups with their members
        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        const { data: allMembers } = await supabase
          .from('group_members')
          .select('*')
          .in('group_id', groupIds);

        const enrichedGroups = (groupsData || []).map(g => ({
          ...g,
          members: (allMembers || []).filter(m => m.group_id === g.id),
        }));

        setUserGroups(enrichedGroups);
      } else {
        setUserGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error.message);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
    if (groupId) {
      const group = userGroups.find(g => g.id === groupId);
      setSelectedGroupMembers(group ? group.members : []);
    } else {
      setSelectedGroupMembers([]);
    }
  };

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
    if (!selectedGroupId) {
      alert('Please select a group to submit the project under.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in to submit a project');

      // Add Project using the selected group
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          group_id: selectedGroupId,
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

  const selectedGroup = userGroups.find(g => g.id === selectedGroupId);

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
            <h3 className="section-title"><Users size={18} /> Group Details</h3>
            
            {loadingGroups ? (
              <div className="group-select-loading">
                <Loader size={24} className="spinner" />
                <span>Loading your groups...</span>
              </div>
            ) : userGroups.length === 0 ? (
              <div className="no-groups-notice">
                <AlertCircle size={24} />
                <div>
                  <p><strong>You are not part of any group yet.</strong></p>
                  <p>Go to the <a href="/groups" onClick={(e) => { e.preventDefault(); navigate('/groups'); }}>Group Management</a> page to create or join a group first.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label>Select Group *</label>
                  <select
                    id="group-select"
                    value={selectedGroupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    required
                    className="group-dropdown"
                  >
                    <option value="">-- Choose a group --</option>
                    {userGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.members.length} members)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGroup && (
                  <div className="selected-group-details animate-fade-in">
                    <div className="group-info-bar">
                      <div className="group-info-item">
                        <span className="info-label">Group Name</span>
                        <span className="info-value">{selectedGroup.name}</span>
                      </div>
                      <div className="group-info-item">
                        <span className="info-label">Leader</span>
                        <span className="info-value">{selectedGroup.leader_email}</span>
                      </div>
                      <div className="group-info-item">
                        <span className="info-label">Invite Key</span>
                        <code className="info-value key-code">{selectedGroup.student_key}</code>
                      </div>
                    </div>

                    <div className="group-members-preview">
                      <h4>Team Members ({selectedGroupMembers.length})</h4>
                      <div className="members-chips">
                        {selectedGroupMembers.map(member => (
                          <div key={member.id} className="member-chip">
                            <div className="chip-avatar">
                              {member.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chip-info">
                              <span className="chip-name">{member.student_name}</span>
                              <span className="chip-role">
                                {member.student_email === selectedGroup.leader_email ? 'Leader' : 'Member'}
                                {member.roll_number && member.roll_number !== 'N/A' && member.roll_number !== 'Leader' ? ` · ${member.roll_number}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || userGroups.length === 0}>
              {isSubmitting ? 'Submitting...' : <><Upload size={18} /> Submit for Approval</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
