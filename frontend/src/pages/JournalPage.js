import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { journalApi, uploadToCloudinary } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Plus, 
  Loader2, 
  Image as ImageIcon, 
  FileText,
  Mic,
  Calendar,
  Tag,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';

const EMOTION_COLORS = {
  joy: 'bg-[hsl(43,75%,85%)]',
  calm: 'bg-[hsl(120,24%,85%)]',
  sadness: 'bg-[hsl(209,40%,68%)] text-white',
  anger: 'bg-[hsl(0,50%,90%)]',
  anxiety: 'bg-[hsl(270,40%,90%)]',
  neutral: 'bg-muted'
};

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    event_tag: '',
    media_urls: []
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await journalApi.getAll({ limit: 50 });
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to load entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resourceType = type === 'audio' ? 'video' : type === 'document' ? 'raw' : 'image';
      const folder = type === 'audio' ? 'audio' : type === 'document' ? 'documents' : 'journals';
      
      const result = await uploadToCloudinary(file, folder, resourceType);
      
      if (result.secure_url) {
        setFormData(prev => ({
          ...prev,
          media_urls: [...prev.media_urls, result.secure_url]
        }));
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Please write something in your journal');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEntry) {
        await journalApi.update(editingEntry.id, formData);
        toast.success('Entry updated!');
      } else {
        await journalApi.create(formData);
        toast.success('Journal entry saved!');
      }
      
      setShowEditor(false);
      setEditingEntry(null);
      setFormData({ title: '', content: '', tags: [], event_tag: '', media_urls: [] });
      loadEntries();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title || '',
      content: entry.content,
      tags: entry.tags || [],
      event_tag: entry.event_tag || '',
      media_urls: entry.media_urls || []
    });
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await journalApi.delete(id);
        toast.success('Entry deleted');
        loadEntries();
      } catch (error) {
        toast.error('Failed to delete entry');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-background" data-testid="journal-page">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
              Journal
            </h1>
            <p className="text-sm text-muted-foreground">Your personal emotional diary</p>
          </div>
          <Button
            onClick={() => {
              setEditingEntry(null);
              setFormData({ title: '', content: '', tags: [], event_tag: '', media_urls: [] });
              setShowEditor(true);
            }}
            className="rounded-full bg-primary hover:bg-primary/90"
            data-testid="new-entry-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Entries List */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <img 
                src="https://images.pexels.com/photos/29334823/pexels-photo-29334823.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Sunrise"
                className="w-64 h-64 object-cover rounded-3xl mx-auto mb-6 opacity-80"
              />
              <h2 className="text-xl font-medium text-foreground mb-2" style={{ fontFamily: 'Manrope' }}>
                Start Your Journey
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Write your first journal entry and begin tracking your emotional wellness.
              </p>
              <Button
                onClick={() => setShowEditor(true)}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Write First Entry
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="soul-card group"
                    data-testid={`journal-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
                          {entry.title || 'Untitled Entry'}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entry)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {entry.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.sentiment?.primary_emotion && (
                          <span className={`text-xs px-3 py-1 rounded-full ${EMOTION_COLORS[entry.sentiment.primary_emotion] || EMOTION_COLORS.neutral}`}>
                            {entry.sentiment.primary_emotion}
                          </span>
                        )}
                        {entry.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {entry.media_urls?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {entry.media_urls.length} attachment(s)
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Manrope' }}>
                {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your entry a title..."
                  className="rounded-xl"
                  data-testid="journal-title-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">How are you feeling?</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write about your thoughts, feelings, and experiences..."
                  className="min-h-[200px] rounded-xl resize-none"
                  required
                  data-testid="journal-content-input"
                />
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      disabled={uploading}
                    />
                    <div className="h-10 px-4 rounded-full border border-border flex items-center gap-2 hover:bg-muted transition-colors">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">Image</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      disabled={uploading}
                    />
                    <div className="h-10 px-4 rounded-full border border-border flex items-center gap-2 hover:bg-muted transition-colors">
                      <Mic className="h-4 w-4" />
                      <span className="text-sm">Audio</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'document')}
                      disabled={uploading}
                    />
                    <div className="h-10 px-4 rounded-full border border-border flex items-center gap-2 hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Document</span>
                    </div>
                  </label>
                  {uploading && <Loader2 className="h-5 w-5 animate-spin self-center ml-2" />}
                </div>

                {formData.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.media_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        {url.includes('/image/') ? (
                          <img src={url} alt="" className="h-16 w-16 object-cover rounded-lg" />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="rounded-xl"
                  />
                  <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-xs px-3 py-1 rounded-full bg-muted text-foreground flex items-center gap-1"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Tag */}
              <div className="space-y-2">
                <Label htmlFor="event_tag">Life Event (optional)</Label>
                <Input
                  id="event_tag"
                  value={formData.event_tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_tag: e.target.value }))}
                  placeholder="e.g., Birthday, Job Interview, Vacation..."
                  className="rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditor(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full bg-primary hover:bg-primary/90"
                  disabled={submitting}
                  data-testid="journal-submit-button"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingEntry ? (
                    'Update Entry'
                  ) : (
                    'Save Entry'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
