import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary, journalApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Camera, Save, Check, Sun, Moon,
  Palette, Sparkles, BookHeart, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Theme definitions ───────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'default',
    name: 'Petal',
    emoji: '🌸',
    type: 'light',
    preview: ['#fdf2f8', '#f9a8d4', '#fbcfe8'],
    css: {}
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    type: 'light',
    preview: ['#f0f9ff', '#7dd3fc', '#bae6fd'],
    css: {
      '--background': '210 40% 98%',
      '--foreground': '215 35% 14%',
      '--card': '210 40% 100%',
      '--card-foreground': '215 35% 14%',
      '--primary': '199 89% 48%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '210 30% 93%',
      '--muted': '210 20% 93%',
      '--muted-foreground': '215 15% 45%',
      '--border': '210 20% 87%',
      '--accent': '210 30% 93%',
      '--accent-foreground': '215 35% 14%',
      '--input': '210 20% 87%',
    }
  },
  {
    id: 'sage',
    name: 'Forest',
    emoji: '🌿',
    type: 'light',
    preview: ['#f0fdf4', '#86efac', '#bbf7d0'],
    css: {
      '--background': '138 60% 97%',
      '--foreground': '140 30% 11%',
      '--card': '138 60% 100%',
      '--card-foreground': '140 30% 11%',
      '--primary': '142 71% 40%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '138 35% 91%',
      '--muted': '138 25% 91%',
      '--muted-foreground': '140 15% 42%',
      '--border': '138 22% 85%',
      '--accent': '138 35% 91%',
      '--accent-foreground': '140 30% 11%',
      '--input': '138 22% 85%',
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    type: 'dark',
    preview: ['#0f172a', '#818cf8', '#334155'],
    css: {
      '--background': '222 47% 7%',
      '--foreground': '210 40% 96%',
      '--card': '222 47% 10%',
      '--card-foreground': '210 40% 96%',
      '--popover': '222 47% 10%',
      '--popover-foreground': '210 40% 96%',
      '--primary': '226 70% 68%',
      '--primary-foreground': '222 47% 8%',
      '--secondary': '217 32% 15%',
      '--muted': '217 32% 14%',
      '--muted-foreground': '215 20% 58%',
      '--border': '217 32% 19%',
      '--input': '217 32% 19%',
      '--accent': '217 32% 15%',
      '--accent-foreground': '210 40% 96%',
    }
  },
  {
    id: 'dusk',
    name: 'Dusk',
    emoji: '🌆',
    type: 'dark',
    preview: ['#1a0a2e', '#c084fc', '#3b1f6b'],
    css: {
      '--background': '270 50% 6%',
      '--foreground': '270 20% 95%',
      '--card': '270 48% 9%',
      '--card-foreground': '270 20% 95%',
      '--popover': '270 48% 9%',
      '--popover-foreground': '270 20% 95%',
      '--primary': '271 76% 68%',
      '--primary-foreground': '270 50% 6%',
      '--secondary': '270 28% 16%',
      '--muted': '270 24% 13%',
      '--muted-foreground': '270 15% 58%',
      '--border': '270 24% 20%',
      '--input': '270 24% 20%',
      '--accent': '270 28% 16%',
      '--accent-foreground': '270 20% 95%',
    }
  },
];

// ─── Per-theme CSS injections ─────────────────────────────────────────────────
const THEME_INJECT = {
  default: '',

  ocean: `
    body, html { background-color: #f0f9ff !important; }
    .bg-gray-50  { background-color: #e0f2fe !important; }
    .bg-white    { background-color: #ffffff !important; }
    .bg-gray-100 { background-color: #e0f2fe !important; }
    .text-gray-900 { color: #0c4a6e !important; }
    .text-gray-700, .text-gray-800 { color: #075985 !important; }
    .text-gray-600 { color: #0369a1 !important; }
    .text-gray-500 { color: #0284c7 !important; }
    .text-gray-400 { color: #38bdf8 !important; }
    .border-gray-100, .border-gray-200 { border-color: #bae6fd !important; }
    .bg-indigo-50 { background-color: #e0f2fe !important; }
    .text-indigo-600, .text-indigo-700 { color: #0284c7 !important; }
    .border-indigo-100 { border-color: #bae6fd !important; }
  `,

  sage: `
    body, html { background-color: #f0fdf4 !important; }
    .bg-gray-50  { background-color: #dcfce7 !important; }
    .bg-white    { background-color: #ffffff !important; }
    .bg-gray-100 { background-color: #dcfce7 !important; }
    .text-gray-900 { color: #14532d !important; }
    .text-gray-700, .text-gray-800 { color: #166534 !important; }
    .text-gray-600 { color: #15803d !important; }
    .text-gray-500 { color: #16a34a !important; }
    .text-gray-400 { color: #4ade80 !important; }
    .border-gray-100, .border-gray-200 { border-color: #bbf7d0 !important; }
    .bg-indigo-50 { background-color: #dcfce7 !important; }
    .text-indigo-600, .text-indigo-700 { color: #15803d !important; }
    .border-indigo-100 { border-color: #bbf7d0 !important; }
  `,

  midnight: `
    body, html { background-color: #0f172a !important; color: #e2e8f0 !important; }
    .bg-gray-50  { background-color: #0f172a !important; }
    .bg-white    { background-color: #1e293b !important; }
    .bg-gray-100 { background-color: #1e293b !important; }
    .bg-gray-200 { background-color: #334155 !important; }
    .bg-muted    { background-color: #1e293b !important; }
    .text-gray-900 { color: #f1f5f9 !important; }
    .text-gray-800 { color: #e2e8f0 !important; }
    .text-gray-700 { color: #cbd5e1 !important; }
    .text-gray-600 { color: #94a3b8 !important; }
    .text-gray-500 { color: #64748b !important; }
    .text-gray-400 { color: #475569 !important; }
    .border-gray-100 { border-color: #1e293b !important; }
    .border-gray-200 { border-color: #334155 !important; }
    .border-gray-300 { border-color: #475569 !important; }
    input, textarea, select {
      background-color: #1e293b !important;
      color: #f1f5f9 !important;
      border-color: #334155 !important;
    }
    input::placeholder, textarea::placeholder { color: #64748b !important; }
    .soul-card, [class*="soul-card"] {
      background-color: #1e293b !important;
      border-color: #334155 !important;
    }
    .bg-white\/60 { background-color: rgba(30,41,59,0.6) !important; }
    .hover\:shadow-md:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
    aside, nav, [role="navigation"] {
      background-color: #1e293b !important;
      border-color: #334155 !important;
      color: #e2e8f0 !important;
    }
    aside *, nav * { color: #cbd5e1 !important; }
    aside a:hover *, nav a:hover * { color: #f1f5f9 !important; }
    aside svg, nav svg { color: #94a3b8 !important; }
    [class*="text-white"] { color: #ffffff !important; }
    /* Keep pastel mood cards visible with their original colors */
    .bg-amber-50, .bg-amber-100, .bg-yellow-50, .bg-yellow-100 { background-color: #fef9c3 !important; }
    .bg-green-50, .bg-green-100, .bg-teal-50, .bg-teal-100    { background-color: #d1fae5 !important; }
    .bg-blue-50, .bg-blue-100, .bg-sky-50, .bg-sky-100        { background-color: #dbeafe !important; }
    .bg-purple-50, .bg-purple-100, .bg-violet-50, .bg-violet-100 { background-color: #ede9fe !important; }
    .bg-pink-50, .bg-pink-100, .bg-rose-50, .bg-rose-100      { background-color: #fce7f3 !important; }
    .bg-red-50, .bg-red-100                                    { background-color: #fee2e2 !important; }
    /* Force text inside pastel cards to stay dark and readable */
    .bg-amber-50 *, .bg-amber-100 *, .bg-yellow-50 *, .bg-yellow-100 *,
    .bg-green-50 *, .bg-green-100 *, .bg-teal-50 *, .bg-teal-100 *,
    .bg-blue-50 *, .bg-blue-100 *, .bg-sky-50 *, .bg-sky-100 *,
    .bg-purple-50 *, .bg-purple-100 *, .bg-violet-50 *, .bg-violet-100 *,
    .bg-pink-50 *, .bg-pink-100 *, .bg-rose-50 *, .bg-rose-100 *,
    .bg-red-50 *, .bg-red-100 * { color: #1e293b !important; }
  `,

  dusk: `
    body, html { background-color: #0d0118 !important; color: #f5f0ff !important; }
    .bg-gray-50  { background-color: #0d0118 !important; }
    .bg-white    { background-color: #1a0a2e !important; }
    .bg-gray-100 { background-color: #1a0a2e !important; }
    .bg-gray-200 { background-color: #2d1b4e !important; }
    .bg-muted    { background-color: #1a0a2e !important; }
    .text-gray-900 { color: #f5f0ff !important; }
    .text-gray-800 { color: #ede9fe !important; }
    .text-gray-700 { color: #ddd6fe !important; }
    .text-gray-600 { color: #c4b5fd !important; }
    .text-gray-500 { color: #a78bfa !important; }
    .text-gray-400 { color: #7c3aed !important; }
    .border-gray-100 { border-color: #1a0a2e !important; }
    .border-gray-200 { border-color: #2d1b4e !important; }
    .border-gray-300 { border-color: #4c1d95 !important; }
    input, textarea, select {
      background-color: #1a0a2e !important;
      color: #f5f0ff !important;
      border-color: #2d1b4e !important;
    }
    input::placeholder, textarea::placeholder { color: #7c3aed !important; }
    .soul-card, [class*="soul-card"] {
      background-color: #1a0a2e !important;
      border-color: #2d1b4e !important;
    }
    .bg-white\/60 { background-color: rgba(26,10,46,0.6) !important; }
    .hover\:shadow-md:hover { box-shadow: 0 4px 20px rgba(109,40,217,0.3) !important; }
    aside, nav, [role="navigation"] {
      background-color: #1a0a2e !important;
      border-color: #2d1b4e !important;
      color: #f5f0ff !important;
    }
    aside *, nav * { color: #ddd6fe !important; }
    aside a:hover *, nav a:hover * { color: #f5f0ff !important; }
    aside svg, nav svg { color: #c4b5fd !important; }
    [class*="text-white"] { color: #ffffff !important; }
    /* Keep pastel mood cards visible with their original colors */
    .bg-amber-50, .bg-amber-100, .bg-yellow-50, .bg-yellow-100 { background-color: #fef9c3 !important; }
    .bg-green-50, .bg-green-100, .bg-teal-50, .bg-teal-100    { background-color: #d1fae5 !important; }
    .bg-blue-50, .bg-blue-100, .bg-sky-50, .bg-sky-100        { background-color: #dbeafe !important; }
    .bg-purple-50, .bg-purple-100, .bg-violet-50, .bg-violet-100 { background-color: #ede9fe !important; }
    .bg-pink-50, .bg-pink-100, .bg-rose-50, .bg-rose-100      { background-color: #fce7f3 !important; }
    .bg-red-50, .bg-red-100                                    { background-color: #fee2e2 !important; }
    /* Force text inside pastel cards to stay dark and readable */
    .bg-amber-50 *, .bg-amber-100 *, .bg-yellow-50 *, .bg-yellow-100 *,
    .bg-green-50 *, .bg-green-100 *, .bg-teal-50 *, .bg-teal-100 *,
    .bg-blue-50 *, .bg-blue-100 *, .bg-sky-50 *, .bg-sky-100 *,
    .bg-purple-50 *, .bg-purple-100 *, .bg-violet-50 *, .bg-violet-100 *,
    .bg-pink-50 *, .bg-pink-100 *, .bg-rose-50 *, .bg-rose-100 *,
    .bg-red-50 *, .bg-red-100 * { color: #1e293b !important; }
  `,
};

// ─── Apply theme ──────────────────────────────────────────────────────────────
function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;

  THEMES.forEach(t => {
    Object.keys(t.css).forEach(key => root.style.removeProperty(key));
  });

  Object.entries(theme.css).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (theme.type === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  let styleTag = document.getElementById('soul-theme-override');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'soul-theme-override';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = THEME_INJECT[themeId] || '';

  localStorage.setItem('soul-theme', themeId);
}

// Restore saved theme immediately on import
(() => {
  const saved = localStorage.getItem('soul-theme');
  if (saved) applyTheme(saved);
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIME_GREETINGS = [
  { range: [5, 12],  phrases: ['Good morning', 'Rise and shine', 'Morning, sunshine ☀️'] },
  { range: [12, 17], phrases: ['Good afternoon', 'Hey there', 'Hello, lovely'] },
  { range: [17, 21], phrases: ['Good evening', 'Hey you', 'Evening, friend 🌅'] },
  { range: [21, 24], phrases: ['Still up?', 'Good night owl 🦉', 'Evening, dreamer'] },
  { range: [0, 5],   phrases: ["You're up late ✨", 'Hello, night owl', "Can't sleep?"] },
];

function getGreeting(name) {
  const h = new Date().getHours();
  const group = TIME_GREETINGS.find(g => h >= g.range[0] && h < g.range[1]) || TIME_GREETINGS[0];
  const phrase = group.phrases[Math.floor(Math.random() * group.phrases.length)];
  return name ? `${phrase}, ${name.split(' ')[0]}!` : `${phrase}!`;
}

const AFFIRMATIONS = [
  "Your words matter. Keep writing. 💌",
  "Every entry is a little treasure. 🪄",
  "You're doing better than you think. 🌟",
  "This is your safe space. 🫶",
  "Small moments deserve to be remembered. ✨",
  "You're the author of your own story. 📖",
  "Feelings felt are feelings healed. 🌸",
  "Today is worth writing about. 🌈",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('soul-profile') || '{}');
    } catch { return {}; }
  });

  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem('soul-theme') || 'default'
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const [entryCount, setEntryCount] = useState(null);
  const [affirmation] = useState(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
  );
  const [greeting] = useState(() =>
    getGreeting(profile.nickname || profile.username || '')
  );

  useEffect(() => {
    journalApi.getAll({ limit: 100 })
      .then(res => setEntryCount(res.data?.length ?? 0))
      .catch(() => setEntryCount(0));
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'avatars', 'image');
      if (result?.secure_url) {
        setProfile(prev => ({ ...prev, avatar_url: result.secure_url }));
        toast.success('Profile photo updated!');
      } else {
        toast.error('Upload failed — no URL returned');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('soul-profile', JSON.stringify(profile));
      setSavedAnim(true);
      toast.success('Profile saved! 🎉');
      setTimeout(() => setSavedAnim(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    const theme = THEMES.find(t => t.id === themeId);
    toast.success(`${theme?.emoji} ${theme?.name} theme applied!`);
  };

  const displayName = profile.nickname || profile.username || 'Friend';
  const initials = displayName.slice(0, 2).toUpperCase();
  const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

          {/* ── Greeting ── */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-semibold text-foreground mt-0.5">Your Profile</h1>
          </motion.div>

          {/* ── Avatar card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer border-[3px] border-primary/20 hover:border-primary/50 transition-colors shadow-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-primary/60 select-none">{initials}</span>
                  )}
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md"
                >
                  {uploading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />
                  }
                </motion.button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-lg leading-tight truncate">{displayName}</p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    <BookHeart className="w-3 h-3" />
                    {entryCount === null ? '…' : entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {currentTheme.emoji} {currentTheme.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {affirmation}
              </p>
            </div>
          </motion.div>

          {/* ── Edit profile ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">About you</h2>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Username</Label>
              <Input
                placeholder="your_username"
                value={profile.username || ''}
                onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Nickname
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">(used in greetings)</span>
              </Label>
              <Input
                placeholder="What should we call you?"
                value={profile.nickname || ''}
                onChange={e => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Bio</Label>
              <Input
                placeholder="A little something about you…"
                value={profile.bio || ''}
                onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-background border-input"
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2 relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {savedAnim ? (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Saved!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Profile
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>

          {/* ── Themes ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">App Theme</h2>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {THEMES.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                    activeTheme === theme.id
                      ? 'border-primary shadow-md bg-primary/5'
                      : 'border-border hover:border-primary/40 bg-background'
                  }`}
                >
                  <div className="flex gap-0.5">
                    {theme.preview.map((color, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <span className="text-base leading-none">{theme.emoji}</span>
                  <span className="text-xs font-medium text-foreground leading-none">{theme.name}</span>

                  <span className="text-muted-foreground">
                    {theme.type === 'dark'
                      ? <Moon className="w-2.5 h-2.5" />
                      : <Sun className="w-2.5 h-2.5" />
                    }
                  </span>

                  {activeTheme === theme.id && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Theme applies across the whole app and is saved automatically
            </p>
          </motion.div>

          <div className="h-4" />

        </div>
      </main>
    </div>
  );
}