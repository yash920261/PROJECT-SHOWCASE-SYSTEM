import { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, Plus, Heart, MessageCircle, Loader, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Forum.css';

const POPULAR_TAGS = ['All', 'Machine Learning', 'Web3', 'React', 'Collab', 'Python'];

export const Forum = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [showNewPost, setShowNewPost] = useState(false);
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // detail view state
  const [selectedThread, setSelectedThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [userLiked, setUserLiked] = useState(false); // Check if current user liked selected thread

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if(data?.user) setUser(data.user);
    });
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setThreads(data || []);
    } catch (err) {
      console.error('Error fetching threads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      setIsSubmitting(true);
      if (!user) throw new Error('You must be logged in to post');

      const tagsArray = newTags.split(',').map(tag => tag.trim()).filter(t => t);

      const { error } = await supabase
        .from('discussions')
        .insert({
          title: newTitle,
          content: newContent,
          author_id: user.id,
          author_name: user.user_metadata?.name || user.email.split('@')[0],
          tags: tagsArray,
        });

      if (error) throw error;
      
      alert('Discussion posted!');
      setShowNewPost(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      fetchThreads();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openThread = async (thread) => {
    setSelectedThread(thread);
    fetchComments(thread.id);
    checkUserLiked(thread.id);
  };

  const closeThread = () => {
    setSelectedThread(null);
    setComments([]);
    setNewComment('');
  };

  const fetchComments = async (threadId) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('discussion_id', threadId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkUserLiked = async (threadId) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', threadId)
        .eq('user_id', user.id)
        .single();
        
      if (data) setUserLiked(true);
      else setUserLiked(false);
    } catch {
      setUserLiked(false);
    }
  };

  const handleLike = async (e, threadToLike) => {
    e.stopPropagation(); // Prevent opening thread if clicking like on the list
    if (!user) return alert('Please login to like discussions.');
    
    try {
      // Optimistic upate if we are in list view
      const isLikingSelected = selectedThread && selectedThread.id === threadToLike.id;
      
      // If user hasn't liked it (or we assume toggle setup)
      // Check db if already liked to toggle properly
      const { data: existingLike } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', threadToLike.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // UNLIKE logic
        await supabase.from('discussion_likes').delete().eq('id', existingLike.id);
        const newLikesCount = Math.max(0, (threadToLike.likes || 0) - 1);
        await supabase.from('discussions').update({ likes: newLikesCount }).eq('id', threadToLike.id);
        
        if (isLikingSelected) {
          setUserLiked(false);
          setSelectedThread({ ...selectedThread, likes: newLikesCount });
        }
        setThreads(threads.map(t => t.id === threadToLike.id ? { ...t, likes: newLikesCount } : t));
      } else {
        // LIKE logic
        await supabase.from('discussion_likes').insert({
          discussion_id: threadToLike.id,
          user_id: user.id
        });
        const newLikesCount = (threadToLike.likes || 0) + 1;
        await supabase.from('discussions').update({ likes: newLikesCount }).eq('id', threadToLike.id);
        
        if (isLikingSelected) {
          setUserLiked(true);
          setSelectedThread({ ...selectedThread, likes: newLikesCount });
        }
        setThreads(threads.map(t => t.id === threadToLike.id ? { ...t, likes: newLikesCount } : t));
      }
    } catch (err) {
      console.error(err);
      alert('Error processing like.');
    }
  };

  const handlePostComment = async () => {
    if (!user) return alert("You must be logged in to comment.");
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: selectedThread.id,
          author_id: user.id,
          author_name: user.user_metadata?.name || user.email.split('@')[0],
          content: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment('');
      fetchComments(selectedThread.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = activeTag === 'All' || (thread.tags && thread.tags.includes(activeTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="forum-page container animate-fade-in">
      
      <div className="forum-header">
        <div>
          <h1>Discussion Forum</h1>
          <p>Ask questions, share ideas, and find collaborators.</p>
        </div>
        {!selectedThread && (
          <button className="btn-primary" onClick={() => setShowNewPost(!showNewPost)}>
            <Plus size={18} /> New Discussion
          </button>
        )}
      </div>

      {showNewPost && !selectedThread && (
        <div className="new-post-panel glass-panel animate-fade-in">
          <h2>Create New Discussion</h2>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Discussion Title..." 
              className="title-input" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="input-group">
            <textarea 
              rows="4" 
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>
          </div>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Tags (comma separated)..." 
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowNewPost(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreatePost} disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </div>
      )}

      <div className="forum-layout">
        
        {/* Main Feed Area */}
        <div className="forum-feed">
          
          {selectedThread ? (
            <div className="thread-detail-view animate-fade-in">
              <button className="back-btn" onClick={closeThread}>
                <ArrowLeft size={16} /> Back to Discussions
              </button>
              
              <div className="thread-card glass-panel expanded">
                <div className="thread-header-main">
                  <div className="thread-avatar large">{selectedThread.author_name.charAt(0).toUpperCase()}</div>
                  <div className="thread-author-info">
                    <h3>{selectedThread.title}</h3>
                    <span className="author">Posted by <strong>{selectedThread.author_name}</strong> on {new Date(selectedThread.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="thread-content full-text">
                  <p>{selectedThread.content}</p>
                </div>
                
                <div className="thread-tags mt-4">
                  {selectedThread.tags && selectedThread.tags.map(tag => (
                    <span key={`det-${tag}`} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="thread-stats mt-4 border-t pt-4 border-white/10 flex items-center justify-between">
                   <button 
                     className={`like-action-btn ${userLiked ? 'liked' : ''}`}
                     onClick={(e) => handleLike(e, selectedThread)}
                   >
                     <Heart size={18} fill={userLiked ? "currentColor" : "none"} /> 
                     <span>{selectedThread.likes || 0} Likes</span>
                   </button>
                   <span className="text-muted"><MessageCircle size={18} className="inline mr-1" /> {comments.length} Comments</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3>Replies</h3>
                
                <div className="comments-list">
                  {loadingComments ? (
                    <div className="flex justify-center p-4"><Loader className="animate-spin text-primary" /></div>
                  ) : comments.length === 0 ? (
                    <p className="text-muted text-center p-4">No replies yet. Be the first to comment!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="comment-card glass-panel">
                        <div className="comment-header">
                          <div className="comment-avatar">{c.author_name.charAt(0).toUpperCase()}</div>
                          <div className="comment-meta">
                            <strong>{c.author_name}</strong>
                            <span className="text-xs text-muted ml-2">{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="comment-body">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post Comment Form */}
                {user ? (
                  <div className="add-comment-box glass-panel mt-4">
                    <textarea 
                      placeholder="Write a reply..."
                      rows="3"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        className="btn-primary" 
                        onClick={handlePostComment}
                        disabled={isSubmitting || !newComment.trim()}
                      >
                         <Send size={16} className="mr-2" />
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-warning text-center mt-4">Log in to leave a reply.</p>
                )}

              </div>
            </div>
          ) : (
            <>
              {/* Thread List View */}
              <div className="glass-panel search-panel">
                <div className="search-bar">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search discussions..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="thread-list">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader size={32} className="animate-spin text-primary" />
                  </div>
                ) : filteredThreads.map(thread => (
                  <div key={thread.id} className="thread-card glass-panel clickable" onClick={() => openThread(thread)}>
                    <div className="thread-avatar">{thread.author_name.charAt(0).toUpperCase()}</div>
                    <div className="thread-content">
                      <h3 className="thread-title">{thread.title}</h3>
                      <p className="text-muted text-sm line-clamp-2 my-1">{thread.content}</p>
                      <div className="thread-meta">
                        <span className="author">By {thread.author_name} • {new Date(thread.created_at).toLocaleDateString()}</span>
                        <div className="thread-tags">
                          {thread.tags && thread.tags.map(tag => (
                            <span key={`${thread.id}-${tag}`} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="thread-stats">
                      <button 
                        className="stat-btn like-btn"
                        onClick={(e) => handleLike(e, thread)}
                      >
                        <Heart size={16} /> {thread.likes || 0}
                      </button>
                      <div className="stat text-muted">
                        <MessageCircle size={16} /> View
                      </div>
                    </div>
                  </div>
                ))}

                {!loading && filteredThreads.length === 0 && (
                  <div className="no-results glass-panel">
                    <MessageSquare size={32} className="text-muted mb-4 mx-auto" />
                    <p>No discussions found matching your criteria.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="forum-sidebar">
          <div className="glass-panel sidebar-widget">
            <h3><Filter size={18} /> Popular Tags</h3>
            <div className="tag-cloud">
              {POPULAR_TAGS.map(tag => (
                <button 
                  key={tag}
                  className={`tag-btn ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTag(tag);
                    if(selectedThread) closeThread();
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel sidebar-widget">
            <h3>Forum Guidelines</h3>
            <ul className="guidelines-list">
              <li>Be respectful to all members.</li>
              <li>Use clear and descriptive titles.</li>
              <li>Tag your posts correctly.</li>
              <li>No spam or self-promotion.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
