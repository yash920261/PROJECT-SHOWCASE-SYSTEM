import { useState, useEffect } from 'react';
import { Users, Key, Plus, UserPlus, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Group.css';

export const Group = () => {
  const [activeTab, setActiveTab] = useState('my-groups'); // 'my-groups', 'join', 'create'
  const [joinKey, setJoinKey] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }
      setUser(user);
      
      // Fetch all groups the user is part of
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_email', user.email);
        
      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);
        
        // Fetch groups
        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);
          
        // Fetch ALL members for these groups
        const { data: allMembers } = await supabase
          .from('group_members')
          .select('*')
          .in('group_id', groupIds);
          
        // Fetch ALL projects for these groups
        const { data: allProjects } = await supabase
          .from('projects')
          .select('*')
          .in('group_id', groupIds);
          
        // Enriched groups mapping
        const enrichedGroups = (groupsData || []).map(g => ({
          ...g,
          members: (allMembers || []).filter(m => m.group_id === g.id),
          projects: (allProjects || []).filter(p => p.group_id === g.id)
        }));
        
        setUserGroups(enrichedGroups);
        setActiveTab('my-groups');
      } else {
        setUserGroups([]);
        setActiveTab('join');
      }
    } catch (error) {
      console.error('Error fetching group data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to join a group');
    
    // Check if they are already in this specific group
    if (userGroups.some(g => g.student_key === joinKey.toUpperCase())) {
      return alert('You are already a member of this group!');
    }

    try {
      setLoading(true);
      // Find group by key
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('student_key', joinKey.toUpperCase())
        .single();
        
      if (groupError || !group) throw new Error('Invalid Invite Key or Group does not exist');
      
      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          student_email: user.email,
          student_name: user.user_metadata?.name || user.email.split('@')[0],
          roll_number: 'N/A' // Simpler for now
        });
        
      if (joinError) throw joinError;
      
      alert('Successfully joined the group!');
      setJoinKey('');
      fetchUserData();
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to create a group');
    try {
      setLoading(true);
      const studentKey = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create group
      const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName,
          leader_email: user.email,
          student_key: studentKey
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Add creator as member
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          student_email: user.email,
          student_name: user.user_metadata?.name || user.email.split('@')[0],
          roll_number: 'Leader'
        });
        
      if (joinError) throw joinError;
      
      alert('Group created successfully!');
      setNewGroupName('');
      fetchUserData();
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="group-page container animate-fade-in flex items-center justify-center min-h-[50vh]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="group-page container animate-fade-in">
      <div className="page-header">
        <h1>Group Management</h1>
        <p>Collaborate with your peers on academic projects.</p>
        {!user && <p className="text-warning mt-2">You must be logged in to manage groups.</p>}
      </div>

      <div className="group-layout">
        
        {/* Sidebar Nav */}
        <div className="group-nav glass-panel">
          <button 
            className={`nav-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-groups')}
            disabled={userGroups.length === 0 && activeTab !== 'my-groups'} 
          >
            <Users size={18} /> My Groups
          </button>
          <button 
            className={`nav-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <UserPlus size={18} /> Join Group
          </button>
          <button 
            className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={18} /> Create Group
          </button>
        </div>

        {/* Content Area */}
        <div className="group-content glass-panel">
          
          {activeTab === 'my-groups' && (
            <div className="tab-pane animate-fade-in">
              {userGroups.length > 0 ? (
                <div className="groups-list">
                  {userGroups.map((groupData, idx) => (
                    <div key={groupData.id} className={`group-item ${idx > 0 ? 'separated' : ''}`}>
                      <div className="group-header">
                        <h2>{groupData.name}</h2>
                        <div className="key-display">
                          <span className="key-label">Invite Key:</span>
                          <code className="key-value">{groupData.student_key}</code>
                        </div>
                      </div>

                      <div className="content-section">
                        <h3>Members</h3>
                        <div className="members-list">
                          {groupData.members.map(member => (
                            <div key={member.id} className="member-card">
                              <div className="member-avatar">
                                {member.student_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="member-info">
                                <h4>{member.student_name}</h4>
                                <span className="member-role">{member.student_email === groupData.leader_email ? 'Leader' : 'Member'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="content-section">
                        <h3>Submitted Projects</h3>
                        {groupData.projects.length === 0 ? (
                          <p className="text-muted">No projects submitted yet.</p>
                        ) : (
                          <div className="group-projects-list">
                            {groupData.projects.map(project => (
                              <div key={project.id} className="group-project-card">
                                <h4>{project.title}</h4>
                                <span className={`status-badge ${project.status.toLowerCase()}`}>
                                  {project.status.toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-muted mb-4" />
                  <h3>No Groups Found</h3>
                  <p className="text-muted mb-6">You are not currently part of any groups.</p>
                  <div className="flex justify-center gap-4">
                    <button className="btn-outline" onClick={() => setActiveTab('join')}>Join a Group</button>
                    <button className="btn-primary" onClick={() => setActiveTab('create')}>Create Group</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'join' && (
            <div className="tab-pane animate-fade-in">
              <h2>Join an Existing Group</h2>
              <p className="tab-desc">Enter the unique invite key provided by a group leader.</p>
              
              <form onSubmit={handleJoin} className="action-form">
                <div className="input-group">
                  <label>Invite Key</label>
                  <div className="input-wrapper">
                    <Key size={18} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. GRP-XXXX-XXXX" 
                      value={joinKey}
                      onChange={(e) => setJoinKey(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading || !user}>
                  Join Group
                </button>
              </form>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="tab-pane animate-fade-in">
              <h2>Create a New Group</h2>
              <p className="tab-desc">Start a new group and invite your peers to join.</p>
              
              <form onSubmit={handleCreate} className="action-form">
                <div className="input-group">
                  <label>Group Name</label>
                  <div className="input-wrapper">
                    <Users size={18} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Innovators" 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading || !user}>
                  Create Group
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
