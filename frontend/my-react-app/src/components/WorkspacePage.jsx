import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Presentation, 
  Plus, 
  ChevronRight, 
  Clock, 
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  X,
  Send,
  LogOut
} from 'lucide-react';
import { projectAPI, documentAPI } from '../services/api';

const WorkspacePage = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // AI Refinement Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSectionIndex, setAiSectionIndex] = useState(null);
  const [aiSection, setAiSection] = useState(null);
  const [aiSectionTitle, setAiSectionTitle] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentSectionIndex, setCommentSectionIndex] = useState(null);
  const [commentSectionTitle, setCommentSectionTitle] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Feedback State
  const [sectionFeedback, setSectionFeedback] = useState({}); // { sectionTitle: { liked, comment } }

  // New Project Modal State
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [docType, setDocType] = useState('word'); // 'word' or 'ppt'
  const [topic, setTopic] = useState('');
  const [inputMode, setInputMode] = useState('form'); // 'form' or 'json'
  const [sections, setSections] = useState(['']); // For Word
  const [slides, setSlides] = useState(['']); // For PPT
  const [jsonInput, setJsonInput] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getProjects();
      setProjects(data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const fetchProjectVersions = async (projectId) => {
    try {
      const data = await projectAPI.getProjectVersions(projectId);
      // Update selected project with versions, preserving the project data
      setSelectedProject(prev => prev ? { ...prev, versions: data.versions } : { versions: data.versions });
      
      // Auto-select latest version
      if (data.versions && data.versions.length > 0) {
        const latest = data.versions[data.versions.length - 1];
        await selectVersion(projectId, latest.id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setLoading(false);
    }
  };

  const selectVersion = async (projectId, versionId) => {
    try {
      setContent(null); // Clear content while loading
      setSectionFeedback({}); // Clear feedback
      const [contentData, feedbackData] = await Promise.all([
        projectAPI.getVersionContent(projectId, versionId),
        projectAPI.getFeedback(projectId, versionId)
      ]);
      setSelectedVersion(contentData.version);
      setContent(contentData.content);
      
      // Convert feedback array to object keyed by section_title
      const feedbackMap = {};
      if (feedbackData.feedback) {
        feedbackData.feedback.forEach(fb => {
          feedbackMap[fb.section_title] = {
            liked: fb.liked,
            comment: fb.comment
          };
        });
      }
      setSectionFeedback(feedbackMap);
    } catch (error) {
      console.error('Error fetching version content:', error);
      // alert('Failed to load version content');
    }
  };

  const handleProjectClick = async (project) => {
    // Clear previous state when switching projects
    setSelectedProject(project);
    setSelectedVersion(null);
    setContent(null);
    setLoading(true);
    await fetchProjectVersions(project.id);
  };

  // Helper function to get section title from content
  const getSectionTitle = (sectionIndex, section) => {
    if (selectedProject.doctype === 1) {
      // Word document - use heading text or fallback
      return section?.heading?.text || `Section ${sectionIndex + 1}`;
    } else {
      // PPT - use slide title
      return section?.title || `Slide ${sectionIndex + 1}`;
    }
  };

  const handleLike = async (sectionIndex, section) => {
    try {
      const sectionTitle = getSectionTitle(sectionIndex, section);
      await projectAPI.submitFeedback(selectedProject.id, selectedVersion.id, sectionTitle, true);
      
      // Update local feedback state
      setSectionFeedback(prev => ({
        ...prev,
        [sectionTitle]: { ...prev[sectionTitle], liked: true }
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // alert('Failed to submit feedback');
    }
  };

  const handleDislike = async (sectionIndex, section) => {
    try {
      const sectionTitle = getSectionTitle(sectionIndex, section);
      await projectAPI.submitFeedback(selectedProject.id, selectedVersion.id, sectionTitle, false);
      
      // Update local feedback state
      setSectionFeedback(prev => ({
        ...prev,
        [sectionTitle]: { ...prev[sectionTitle], liked: false }
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // alert('Failed to submit feedback');
    }
  };

  const openAiModal = (index, section) => {
    setAiSectionIndex(index);
    setAiSection(section);
    const sectionTitle = getSectionTitle(index, section);
    setAiSectionTitle(sectionTitle);
    setAiModalOpen(true);
    setAiPrompt('');
  };

  const handleAiRefinement = async () => {
    if (!aiPrompt.trim() || !aiSectionTitle) return;
    
    setAiLoading(true);
    try {
      const data = await projectAPI.refineContent(
        selectedProject.id,
        selectedVersion.id,
        aiSectionTitle,
        aiPrompt
      );
      
      // New version was created, refresh versions and switch to it
      await fetchProjectVersions(selectedProject.id);
      
      // Switch to the new version
      if (data.version && data.version.id) {
        await selectVersion(selectedProject.id, data.version.id);
      }
      
      setAiModalOpen(false);
      setAiPrompt('');
      setAiSectionTitle(null);
      setAiSection(null);
      
      // alert('Section refined! A new version has been created.');
    } catch (error) {
      console.error('Error refining content:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to refine content';
      // alert(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  const openCommentModal = (index, section) => {
    setCommentSectionIndex(index);
    const sectionTitle = getSectionTitle(index, section);
    setCommentSectionTitle(sectionTitle);
    // Load existing comment if any
    const existingComment = sectionFeedback[sectionTitle]?.comment || '';
    setCommentText(existingComment);
    setCommentModalOpen(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await projectAPI.addComment(
        selectedProject.id,
        selectedVersion.id,
        commentSectionTitle,
        commentText
      );
      
      // Update local feedback state
      setSectionFeedback(prev => ({
        ...prev,
        [commentSectionTitle]: { ...prev[commentSectionTitle], comment: commentText }
      }));
      
      setCommentModalOpen(false);
      setCommentText('');
      setCommentSectionTitle(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      // alert('Failed to add comment');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await projectAPI.downloadDocument(selectedProject.id, selectedVersion.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProject.title}.${selectedProject.doctype === 1 ? 'docx' : 'pptx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading:', error);
      // alert('Failed to download document');
    }
  };

  // New Project Modal Handlers
  const handleSuggestOutline = async () => {
    if (!topic.trim()) {
      // alert('Please enter a topic first');
      return;
    }

    setSuggestLoading(true);
    try {
      const result = await documentAPI.suggestOutline(topic, docType);
      if (docType === 'word') {
        setSections(result.sections || []);
      } else {
        setSlides(result.slides || []);
      }
    } catch (error) {
      console.error('Error suggesting outline:', error);
      // alert('Failed to get suggestions');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAddSection = () => {
    if (docType === 'word') {
      setSections([...sections, '']);
    } else {
      setSlides([...slides, '']);
    }
  };

  const handleRemoveSection = (index) => {
    if (docType === 'word') {
      setSections(sections.filter((_, i) => i !== index));
    } else {
      setSlides(slides.filter((_, i) => i !== index));
    }
  };

  const handleSectionChange = (index, value) => {
    if (docType === 'word') {
      const newSections = [...sections];
      newSections[index] = value;
      setSections(newSections);
    } else {
      const newSlides = [...slides];
      newSlides[index] = value;
      setSlides(newSlides);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      // alert('Please enter a topic');
      return;
    }

    let sectionsToUse = [];
    let slidesToUse = [];

    if (inputMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        if (docType === 'word') {
          sectionsToUse = parsed.sections || [];
        } else {
          slidesToUse = parsed.slides || [];
        }
      } catch (error) {
        // alert('Invalid JSON format');
        return;
      }
    } else {
      if (docType === 'word') {
        sectionsToUse = sections.filter(s => s.trim());
        if (sectionsToUse.length === 0) {
          // alert('Please add at least one section');
          return;
        }
      } else {
        slidesToUse = slides.filter(s => s.trim());
        if (slidesToUse.length === 0) {
          // alert('Please add at least one slide');
          return;
        }
      }
    }

    setGenerateLoading(true);
    try {
      let result;
      if (docType === 'word') {
        result = await documentAPI.generateWord(topic, sectionsToUse);
      } else {
        result = await documentAPI.generatePPT(topic, slidesToUse);
      }

      // Close modal and refresh projects
      setNewProjectModalOpen(false);
      resetNewProjectForm();
      await fetchProjects();

      // Auto-select the newly created project
      if (result.project) {
        handleProjectClick(result.project);
      }

      // alert('Project created successfully!');
    } catch (error) {
      console.error('Error generating project:', error);
      // alert('Failed to create project');
    } finally {
      setGenerateLoading(false);
    }
  };

  const resetNewProjectForm = () => {
    setTopic('');
    setDocType('word');
    setInputMode('form');
    setSections(['']);
    setSlides(['']);
    setJsonInput('');
  };

  const handleCloseNewProjectModal = () => {
    setNewProjectModalOpen(false);
    resetNewProjectForm();
  };

  // Group Word document blocks into sections (heading + following paragraphs)
  const groupWordBlocks = (blocks) => {
    if (!blocks || blocks.length === 0) return [];
    
    const sections = [];
    let currentSection = null;
    
    blocks.forEach((block, index) => {
      if (block.type === 'heading') {
        // Start a new section
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: block,
          paragraphs: [],
          startIndex: index
        };
      } else if (block.type === 'paragraph' && currentSection) {
        // Add paragraph to current section
        currentSection.paragraphs.push(block);
      } else if (block.type === 'paragraph' && !currentSection) {
        // Paragraph without a heading - create a section for it
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: null,
          paragraphs: [block],
          startIndex: index
        };
      }
    });
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const renderSectionCard = (block, index) => {
    // doctype: 0 = PPT, 1 = Word (from backend routes.py)
    if (selectedProject.doctype === 1) {
      // Word Document - This should not be called directly for Word docs
      // Use renderWordSection instead
      return null;
    } else {
      // PowerPoint (doctype === 0)
      const slide = block;
      // Handle cases where slide might not have all properties
      const slideTitle = slide?.title || 'Untitled Slide';
      const slideBullets = slide?.bullets || [];
      
      return (
        <div
          key={index}
          className="rounded-lg p-6 mb-4"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F1F5F9' }}>
            {slideTitle}
          </h2>
          {slideBullets.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {slideBullets.map((bullet, i) => (
                <li key={i} className="flex items-start">
                  <span style={{ color: '#A78BFA', marginRight: '8px' }}>•</span>
                  <span style={{ color: '#CBD5E1' }}>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#CBD5E1', fontStyle: 'italic' }}>No content available for this slide.</p>
          )}
          
          {(() => {
            const sectionTitle = getSectionTitle(index, block);
            const feedback = sectionFeedback[sectionTitle] || {};
            const isLiked = feedback.liked === true;
            const isDisliked = feedback.liked === false;
            const hasComment = !!feedback.comment;

            return (
              <>
                {hasComment && (
                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}>
                    <p className="text-sm" style={{ color: '#CBD5E1' }}>
                      <strong style={{ color: '#A78BFA' }}>Your comment:</strong> {feedback.comment}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
                  <button
                    onClick={() => handleLike(index, block)}
                    className="p-2 rounded-lg transition-all"
                    style={{ 
                      color: isLiked ? '#34D399' : '#CBD5E1', 
                      backgroundColor: '#0F172A',
                      border: isLiked ? '1px solid #34D399' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => !isLiked && (e.target.style.color = '#34D399')}
                    onMouseLeave={(e) => !isLiked && (e.target.style.color = '#CBD5E1')}
                    title="Like"
                  >
                    <ThumbsUp size={18} />
                  </button>
                  <button
                    onClick={() => handleDislike(index, block)}
                    className="p-2 rounded-lg transition-all"
                    style={{ 
                      color: isDisliked ? '#F472B6' : '#CBD5E1', 
                      backgroundColor: '#0F172A',
                      border: isDisliked ? '1px solid #F472B6' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => !isDisliked && (e.target.style.color = '#F472B6')}
                    onMouseLeave={(e) => !isDisliked && (e.target.style.color = '#CBD5E1')}
                    title="Dislike"
                  >
                    <ThumbsDown size={18} />
                  </button>
                  <button
                    onClick={() => openCommentModal(index, block)}
                    className="p-2 rounded-lg transition-all"
                    style={{ 
                      color: hasComment ? '#A78BFA' : '#CBD5E1', 
                      backgroundColor: '#0F172A',
                      border: hasComment ? '1px solid #A78BFA' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => !hasComment && (e.target.style.color = '#A78BFA')}
                    onMouseLeave={(e) => !hasComment && (e.target.style.color = '#CBD5E1')}
                    title={hasComment ? "Edit Comment" : "Add Comment"}
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button
                    onClick={() => openAiModal(index, block)}
                    className="p-2 rounded-lg transition-all ml-auto"
                    style={{ color: '#CBD5E1', backgroundColor: '#0F172A' }}
                    onMouseEnter={(e) => e.target.style.color = '#A78BFA'}
                    onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}
                    title="AI Refinement"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      );
    }
  };

  // Render Word document section (heading + paragraphs grouped together)
  const renderWordSection = (section, sectionIndex) => {
    const sectionTitle = getSectionTitle(sectionIndex, section);
    const feedback = sectionFeedback[sectionTitle] || {};
    const isLiked = feedback.liked === true;
    const isDisliked = feedback.liked === false;
    const hasComment = !!feedback.comment;

    return (
      <div
        key={sectionIndex}
        className="rounded-lg p-6 mb-4"
        style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
      >
        <div className="mb-4">
          {section.heading && (
            <h2 
              className="font-bold mb-3"
              style={{ 
                color: '#F1F5F9',
                fontSize: section.heading.level === 1 ? '24px' : section.heading.level === 2 ? '20px' : '18px',
                marginBottom: section.paragraphs.length > 0 ? '12px' : '0'
              }}
            >
              {section.heading.text}
            </h2>
          )}
          {section.paragraphs.length > 0 && (
            <div className="space-y-3">
              {section.paragraphs.map((paragraph, pIndex) => (
                <p 
                  key={pIndex}
                  style={{ color: '#CBD5E1', lineHeight: '1.7' }}
                >
                  {paragraph.text}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {hasComment && (
          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}>
            <p className="text-sm" style={{ color: '#CBD5E1' }}>
              <strong style={{ color: '#A78BFA' }}>Your comment:</strong> {feedback.comment}
            </p>
          </div>
        )}
        
        <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
          <button
            onClick={() => handleLike(sectionIndex, section)}
            className="p-2 rounded-lg transition-all"
            style={{ 
              color: isLiked ? '#34D399' : '#CBD5E1', 
              backgroundColor: isLiked ? '#0F172A' : '#0F172A',
              border: isLiked ? '1px solid #34D399' : '1px solid transparent'
            }}
            onMouseEnter={(e) => !isLiked && (e.target.style.color = '#34D399')}
            onMouseLeave={(e) => !isLiked && (e.target.style.color = '#CBD5E1')}
            title="Like"
          >
            <ThumbsUp size={18} />
          </button>
          <button
            onClick={() => handleDislike(sectionIndex, section)}
            className="p-2 rounded-lg transition-all"
            style={{ 
              color: isDisliked ? '#F472B6' : '#CBD5E1', 
              backgroundColor: '#0F172A',
              border: isDisliked ? '1px solid #F472B6' : '1px solid transparent'
            }}
            onMouseEnter={(e) => !isDisliked && (e.target.style.color = '#F472B6')}
            onMouseLeave={(e) => !isDisliked && (e.target.style.color = '#CBD5E1')}
            title="Dislike"
          >
            <ThumbsDown size={18} />
          </button>
          <button
            onClick={() => openCommentModal(sectionIndex, section)}
            className="p-2 rounded-lg transition-all"
            style={{ 
              color: hasComment ? '#A78BFA' : '#CBD5E1', 
              backgroundColor: '#0F172A',
              border: hasComment ? '1px solid #A78BFA' : '1px solid transparent'
            }}
            onMouseEnter={(e) => !hasComment && (e.target.style.color = '#A78BFA')}
            onMouseLeave={(e) => !hasComment && (e.target.style.color = '#CBD5E1')}
            title={hasComment ? "Edit Comment" : "Add Comment"}
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => openAiModal(sectionIndex, section)}
            className="p-2 rounded-lg transition-all ml-auto"
            style={{ color: '#CBD5E1', backgroundColor: '#0F172A' }}
            onMouseEnter={(e) => e.target.style.color = '#A78BFA'}
            onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}
            title="AI Refinement"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Sidebar - Projects */}
      <div 
        className="w-80 border-r overflow-y-auto"
        style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
              Projects
            </h2>
            <button
              onClick={() => setNewProjectModalOpen(true)}
              className="p-2 rounded-lg transition-all"
              style={{ backgroundColor: '#A78BFA', color: '#0F172A' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#9333EA'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#A78BFA'}
              title="New Project"
            >
              <Plus size={20} />
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#CBD5E1' }}>Loading...</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: selectedProject?.id === project.id ? '#0F172A' : 'transparent',
                    border: selectedProject?.id === project.id ? '1px solid #A78BFA' : '1px solid #334155'
                  }}
                >
                  <div className="flex items-start gap-3">
                    {project.doctype === 1 ? (
                      <FileText size={20} style={{ color: '#A78BFA', flexShrink: 0 }} />
                    ) : (
                      <Presentation size={20} style={{ color: '#F472B6', flexShrink: 0 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" style={{ color: '#F1F5F9' }}>
                        {project.title}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t" style={{ borderColor: '#334155' }}>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm"
            style={{ color: '#CBD5E1' }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {!selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: '#CBD5E1' }}>Select a project to view content</p>
            </div>
          ) : !content ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: '#CBD5E1' }}>Loading content...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold" style={{ color: '#F1F5F9' }}>
                  {selectedProject.title}
                </h1>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#A78BFA', color: '#0F172A' }}
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              {selectedProject.doctype === 1 
                ? groupWordBlocks(content.blocks)?.map((section, index) => renderWordSection(section, index))
                : content.slides?.map((slide, index) => renderSectionCard(slide, index))
              }
            </div>
          )}
        </div>

        {/* Versions Sidebar */}
        {selectedProject && (
          <div 
            className="w-64 border-l overflow-y-auto p-6"
            style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#F1F5F9' }}>
              Versions
            </h3>
            <div className="space-y-2">
              {selectedProject.versions?.map((version) => (
                <button
                  key={version.id}
                  onClick={() => selectVersion(selectedProject.id, version.id)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: selectedVersion?.id === version.id ? '#0F172A' : 'transparent',
                    border: selectedVersion?.id === version.id ? '1px solid #A78BFA' : '1px solid #334155'
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} style={{ color: '#CBD5E1' }} />
                    <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                      Version {version.version_number}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#CBD5E1' }}>
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Refinement Modal */}
      {aiModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000 }}
        >
          <div 
            className="w-full max-w-2xl rounded-lg p-6"
            style={{ backgroundColor: '#1E293B' }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={24} style={{ color: '#A78BFA' }} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                    AI Refinement
                  </h3>
                  {aiSectionTitle && (
                    <p className="text-sm" style={{ color: '#CBD5E1', marginTop: '4px' }}>
                      Refining: {aiSectionTitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  setAiPrompt('');
                  setAiSectionTitle(null);
                  setAiSection(null);
                }}
                style={{ color: '#CBD5E1' }}
              >
                <X size={24} />
              </button>
            </div>

            <p className="mb-4" style={{ color: '#CBD5E1' }}>
              Describe how you'd like to refine this section (e.g., "make it shorter", "make it more formal", "add more details"):
            </p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., Make it more concise, add more technical details, simplify the language..."
              rows={6}
              className="w-full p-4 rounded-lg outline-none resize-none"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAiModalOpen(false)}
                className="flex-1 py-2 rounded-lg"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#CBD5E1',
                  border: '1px solid #334155'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAiRefinement}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#A78BFA',
                  color: '#0F172A',
                  opacity: aiLoading || !aiPrompt.trim() ? 0.5 : 1
                }}
              >
                <Send size={18} />
                {aiLoading ? 'Refining...' : 'Refine with AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000 }}
        >
          <div 
            className="w-full max-w-lg rounded-lg p-6"
            style={{ backgroundColor: '#1E293B' }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={24} style={{ color: '#A78BFA' }} />
                <h3 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                  {commentSectionTitle && sectionFeedback[commentSectionTitle]?.comment ? 'Edit Comment' : 'Add Comment'}
                </h3>
              </div>
              <button
                onClick={() => setCommentModalOpen(false)}
                style={{ color: '#CBD5E1' }}
              >
                <X size={24} />
              </button>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment here..."
              rows={4}
              className="w-full p-4 rounded-lg outline-none resize-none"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCommentModalOpen(false)}
                className="flex-1 py-2 rounded-lg"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#CBD5E1',
                  border: '1px solid #334155'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="flex-1 py-2 rounded-lg"
                style={{
                  backgroundColor: '#A78BFA',
                  color: '#0F172A',
                  opacity: !commentText.trim() ? 0.5 : 1
                }}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000 }}
        >
          <div 
            className="w-full max-w-3xl rounded-lg p-6 overflow-y-auto"
            style={{ 
              backgroundColor: '#1E293B',
              maxHeight: '90vh'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Plus size={24} style={{ color: '#A78BFA' }} />
                <h3 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
                  Create New Project
                </h3>
              </div>
              <button
                onClick={handleCloseNewProjectModal}
                style={{ color: '#CBD5E1' }}
                className="p-1 rounded-lg hover:bg-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Document Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: '#F1F5F9' }}>
                Document Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDocType('word');
                    setSections(['']);
                    setSlides(['']);
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: docType === 'word' ? '#A78BFA' : 'transparent',
                    color: docType === 'word' ? '#0F172A' : '#CBD5E1',
                    border: docType === 'word' ? 'none' : '1px solid #334155'
                  }}
                >
                  <FileText size={20} className="inline mr-2" />
                  Word Document
                </button>
                <button
                  onClick={() => {
                    setDocType('ppt');
                    setSections(['']);
                    setSlides(['']);
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: docType === 'ppt' ? '#A78BFA' : 'transparent',
                    color: docType === 'ppt' ? '#0F172A' : '#CBD5E1',
                    border: docType === 'ppt' ? 'none' : '1px solid #334155'
                  }}
                >
                  <Presentation size={20} className="inline mr-2" />
                  PowerPoint
                </button>
              </div>
            </div>

            {/* Topic Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#F1F5F9' }}>
                Topic {docType === 'word' ? '(Main Topic)' : '(Presentation Topic)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={docType === 'word' ? 'Enter main topic...' : 'Enter presentation topic...'}
                  className="flex-1 px-4 py-2.5 rounded-lg outline-none transition-all"
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#F1F5F9',
                    border: '1px solid #334155'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
                <button
                  onClick={handleSuggestOutline}
                  disabled={!topic.trim() || suggestLoading}
                  className="px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: '#A78BFA',
                    color: '#0F172A',
                    opacity: !topic.trim() || suggestLoading ? 0.5 : 1
                  }}
                >
                  <Sparkles size={18} />
                  {suggestLoading ? 'Suggesting...' : 'AI Suggest'}
                </button>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInputMode('form');
                    // Sync JSON to form when switching to form mode
                    try {
                      if (jsonInput.trim()) {
                        const parsed = JSON.parse(jsonInput);
                        if (docType === 'word') {
                          setSections(parsed.sections || ['']);
                        } else {
                          setSlides(parsed.slides || ['']);
                        }
                      }
                    } catch (e) {
                      // If JSON is invalid, keep current form values
                      console.error('Invalid JSON, keeping form values');
                    }
                  }}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: inputMode === 'form' ? '#A78BFA' : 'transparent',
                    color: inputMode === 'form' ? '#0F172A' : '#CBD5E1',
                    border: inputMode === 'form' ? 'none' : '1px solid #334155'
                  }}
                >
                  Form
                </button>
                <button
                  onClick={() => {
                    setInputMode('json');
                    // Sync form to JSON when switching to JSON mode
                    if (docType === 'word') {
                      setJsonInput(JSON.stringify({ sections: sections.filter(s => s.trim()) }, null, 2));
                    } else {
                      setJsonInput(JSON.stringify({ slides: slides.filter(s => s.trim()) }, null, 2));
                    }
                  }}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: inputMode === 'json' ? '#A78BFA' : 'transparent',
                    color: inputMode === 'json' ? '#0F172A' : '#CBD5E1',
                    border: inputMode === 'json' ? 'none' : '1px solid #334155'
                  }}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Form Input Mode */}
            {inputMode === 'form' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium" style={{ color: '#F1F5F9' }}>
                    {docType === 'word' ? 'Sections' : 'Slides'}
                  </label>
                  <button
                    onClick={handleAddSection}
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: '#A78BFA',
                      color: '#0F172A'
                    }}
                  >
                    + Add {docType === 'word' ? 'Section' : 'Slide'}
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(docType === 'word' ? sections : slides).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleSectionChange(index, e.target.value)}
                        placeholder={docType === 'word' ? `Section ${index + 1}...` : `Slide ${index + 1}...`}
                        className="flex-1 px-4 py-2 rounded-lg outline-none transition-all"
                        style={{
                          backgroundColor: '#0F172A',
                          color: '#F1F5F9',
                          border: '1px solid #334155'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                        onBlur={(e) => e.target.style.borderColor = '#334155'}
                      />
                      <button
                        onClick={() => handleRemoveSection(index)}
                        className="px-3 py-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: '#0F172A',
                          color: '#F472B6',
                          border: '1px solid #334155'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Input Mode */}
            {inputMode === 'json' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#F1F5F9' }}>
                  JSON Input
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={docType === 'word' 
                    ? '{\n  "sections": ["Section 1", "Section 2", ...]\n}'
                    : '{\n  "slides": ["Slide 1", "Slide 2", ...]\n}'
                  }
                  rows={8}
                  className="w-full p-4 rounded-lg outline-none resize-none font-mono text-sm"
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#F1F5F9',
                    border: '1px solid #334155'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseNewProjectModal}
                className="flex-1 py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#CBD5E1',
                  border: '1px solid #334155'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#A78BFA',
                  color: '#0F172A',
                  opacity: generateLoading ? 0.5 : 1
                }}
              >
                {generateLoading ? 'Generating...' : 'Generate'}
                {!generateLoading && <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;