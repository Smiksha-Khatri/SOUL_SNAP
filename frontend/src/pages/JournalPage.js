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
import { Badge } from '../components/ui/badge';
import {
  Plus, Loader2, Image as ImageIcon, FileText,
  Mic, Calendar, Tag, X, Trash2, Edit2, Eye,
  Music, File, ExternalLink, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

const EMOTION_COLORS = {
  joy:     { bg: 'bg-amber-50 border-amber-200',    badge: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400' },
  calm:    { bg: 'bg-green-50 border-green-200',    badge: 'bg-green-100 text-green-800',   dot: 'bg-green-400' },
  sadness: { bg: 'bg-blue-50 border-blue-200',      badge: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-400' },
  anger:   { bg: 'bg-red-50 border-red-200',        badge: 'bg-red-100 text-red-800',       dot: 'bg-red-400' },
  anxiety: { bg: 'bg-purple-50 border-purple-200',  badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
  neutral: { bg: 'bg-gray-50 border-gray-200',      badge: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400' },
};

const DEFAULT_EMOTION = EMOTION_COLORS.neutral;

function getEmotionStyle(tag) {
  return EMOTION_COLORS[tag?.toLowerCase()] || DEFAULT_EMOTION;
}

function getMediaType(url) {
  if (!url) return 'unknown';
  if (url.includes('/image/upload/')) return 'image';
  if (url.includes('/video/upload/')) return 'audio';
  if (url.includes('/raw/upload/'))   return 'document';
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/.test(lower)) return 'image';
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/.test(lower))       return 'audio';
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower))                   return 'video';
  return 'document';
}

function MediaPreview({ url, compact = false }) {
  const type = getMediaType(url);
  const filename = url.split('/').pop()?.split('?')[0] || 'File';

  if (type === 'image') {
    return (
      <div className={`rounded-lg overflow-hidden border border-gray-100 ${compact ? 'h-20 w-20' : 'w-full max-h-80'}`}>
        <img src={url} alt="Journal media" className={`object-cover ${compact ? 'h-full w-full' : 'w-full h-full max-h-80'}`} />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Music className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <audio controls src={url} className="flex-1 h-8" style={{ minWidth: 0 }} />
      </div>
    );
  }

  if (type === 'video') {
    return <video controls src={url} className={`rounded-lg w-full ${compact ? 'h-20' : 'max-h-60'}`} />;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors group">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <File className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <span className="text-sm text-gray-700 truncate flex-1">{filename}</span>
      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
    </a>
  );
}

function UploadButton({ icon: Icon, label, accept, onUpload, uploading }) {
  const inputRef = React.useRef(null);
  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
        {label}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onUpload} />
    </>
  );
}

export default function JournalPage() {
  const [viewEntry, setViewEntry]       = useState(null);
  const [entries, setEntries]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showEditor, setShowEditor]     = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData]         = useState({ title: '', content: '', tags: [], event_tag: '', media_urls: [] });
  const [uploading, setUploading]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [tagInput, setTagInput]         = useState('');

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const res = await journalApi.getAll({ limit: 50 });
      setEntries(res.data);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const resourceType = type === 'audio' ? 'video' : type === 'document' ? 'raw' : 'image';
      const folder       = type === 'audio' ? 'audio' : type === 'document' ? 'documents' : 'journals';
      const result       = await uploadToCloudinary(file, folder, resourceType);
      if (result?.secure_url) {
        setFormData(prev => ({ ...prev, media_urls: [...prev.media_urls, result.secure_url] }));
        toast.success('File uploaded');
      } else {
        toast.error('Upload failed — no URL returned');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
    finally {
      setUploading(false);
    }
  };

  const removeMedia = (index) =>
    setFormData(prev => ({ ...prev, media_urls: prev.media_urls.filter((_, i) => i !== index) }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !formData.tags.includes(t))
      setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag) =>
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) { toast.error('Write something first'); return; }
    setSubmitting(true);
    try {
      if (editingEntry) {
        await journalApi.update(editingEntry.id, formData);
        toast.success('Entry updated');
      } else {
        await journalApi.create(formData);
        toast.success('Entry saved');
      }
      closeEditor();
      loadEntries();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingEntry(null);
    setFormData({ title: '', content: '', tags: [], event_tag: '', media_urls: [] });
    setTagInput('');
  };

  const handleEdit = (entry, e) => {
    e?.stopPropagation();
    setEditingEntry(entry);
    setFormData({
      title: entry.title || '',
      content: entry.content || '',
      tags: entry.tags || [],
      event_tag: entry.event_tag || '',
      media_urls: entry.media_urls || [],
    });
    setShowEditor(true);
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this entry?')) return;
    try {
      await journalApi.delete(id);
      toast.success('Entry deleted');
      if (viewEntry?.id === id) setViewEntry(null);
      loadEntries();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const EMOTIONS = ['joy', 'calm', 'sadness', 'anger', 'anxiety', 'neutral'];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Journal</h1>
            <p className="text-sm text-gray-500 mt-0.5">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <Button onClick={() => { closeEditor(); setShowEditor(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Entry
          </Button>
        </div>

        {/* ENTRIES LIST */}
        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No entries yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "New Entry" to start journaling</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              <AnimatePresence initial={false}>
                {entries.map((entry, idx) => {
                  const style = getEmotionStyle(entry.event_tag);
                  const images = (entry.media_urls || []).filter(u => getMediaType(u) === 'image');
                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ delay: idx * 0.03 }}
                      onClick={() => setViewEntry(entry)}
                      className={`group relative bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${style.bg}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          {entry.title && <h3 className="font-semibold text-gray-900 text-sm truncate">{entry.title}</h3>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                            {entry.event_tag && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{entry.event_tag}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setViewEntry(entry); }} className="p-1.5 rounded-md hover:bg-white/70 text-gray-500 hover:text-gray-700 transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleEdit(entry, e)} className="p-1.5 rounded-md hover:bg-white/70 text-gray-500 hover:text-gray-700 transition-colors" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDelete(entry.id, e)} className="p-1.5 rounded-md hover:bg-white/70 text-red-400 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{entry.content}</p>
                      {images.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {images.slice(0, 4).map((url, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {i === 3 && images.length > 4 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">+{images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {(entry.media_urls || []).some(u => getMediaType(u) !== 'image') && (
                        <div className="flex items-center gap-1 mt-2">
                          {(entry.media_urls || []).filter(u => getMediaType(u) === 'audio').length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Music className="w-3 h-3" />
                              {(entry.media_urls || []).filter(u => getMediaType(u) === 'audio').length} audio
                            </span>
                          )}
                          {(entry.media_urls || []).filter(u => getMediaType(u) === 'document').length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                              <File className="w-3 h-3" />
                              {(entry.media_urls || []).filter(u => getMediaType(u) === 'document').length} file(s)
                            </span>
                          )}
                        </div>
                      )}
                      {entry.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-white/60 border border-gray-200 rounded-full text-gray-600">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* VIEW ENTRY DIALOG */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 leading-tight">
                  {viewEntry?.title || 'Journal Entry'}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(viewEntry?.created_at)}
                  </div>
                  {viewEntry?.event_tag && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEmotionStyle(viewEntry.event_tag).badge}`}>
                      {viewEntry.event_tag}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                <button onClick={(e) => { setViewEntry(null); handleEdit(viewEntry, e); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Edit entry">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDelete(viewEntry.id, e)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete entry">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{viewEntry?.content}</p>
            {viewEntry?.media_urls?.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Attachments</p>
                {viewEntry.media_urls.map((url, i) => <MediaPreview key={i} url={url} />)}
              </div>
            )}
            {viewEntry?.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {viewEntry.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

{/* EDITOR DIALOG */}
<Dialog open={showEditor} onOpenChange={(open) => { if (!open) closeEditor(); }}>
  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0" aria-describedby={undefined}>
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
      <DialogTitle className="text-lg font-semibold text-gray-900">
        {editingEntry ? 'Edit Entry' : 'New Entry'}
      </DialogTitle>
    </DialogHeader>

    <div className="flex-1 min-h-0 overflow-y-auto px-0">
      <form id="journal-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
          <Input
            id="title"
            placeholder="Give this entry a title..."
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-sm font-medium text-gray-700">
            Content <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="content"
            placeholder="What's on your mind today..."
            value={formData.content}
            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="bg-gray-50 border-gray-200 focus:bg-white resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Mood</Label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(em => {
              const s = EMOTION_COLORS[em];
              const selected = formData.event_tag === em;
              return (
                <button
                  key={em}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, event_tag: selected ? '' : em }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? `${s.badge} border-current ring-1 ring-current`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {em.charAt(0).toUpperCase() + em.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag and press Enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
            <Button type="button" variant="outline" onClick={addTag} className="flex-shrink-0">Add</Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Attachments</Label>
          <div className="flex flex-wrap gap-2">
            <UploadButton icon={ImageIcon} label="Image" accept="image/*" onUpload={(e) => handleFileUpload(e, 'image')} uploading={uploading} />
            <UploadButton icon={Mic} label="Audio" accept="audio/*" onUpload={(e) => handleFileUpload(e, 'audio')} uploading={uploading} />
            <UploadButton icon={FileText} label="Document" accept=".pdf,.doc,.docx,.txt,.csv" onUpload={(e) => handleFileUpload(e, 'document')} uploading={uploading} />
            {uploading && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
              </span>
            )}
          </div>
         
        </div>
{formData.media_urls.length > 0 && (
  <div className="space-y-3 mt-2">
    {formData.media_urls.map((url, i) => (
      <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <MediaPreview url={url} />
        <button
          type="button"
          onClick={() => removeMedia(i)}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center shadow"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
)}
      </form>
    </div>

    {/* Footer always visible outside scroll area */}
    <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
      <Button type="button" variant="ghost" onClick={closeEditor} disabled={submitting}>
        Cancel
      </Button>
      <Button type="submit" form="journal-form" disabled={submitting || uploading}>
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
        ) : (
          editingEntry ? 'Save Changes' : 'Save Entry'
        )}
      </Button>
    </div>

  </DialogContent>
</Dialog>
    </div>
  );
}