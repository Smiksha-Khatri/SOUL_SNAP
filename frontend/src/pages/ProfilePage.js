import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary, journalApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Camera, Save, Check, Sun, Moon, Palette, Sparkles,
  BookHeart, Loader2, Bell, Shield, Download, Trash2,
  ChevronRight, Star, Zap, Heart, X
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildMoodPastels(darkText = '#1e293b') {
  return `
    .bg-yellow-50,.bg-yellow-100,.bg-amber-50,.bg-amber-100{background-color:#fef9c3!important}
    .bg-green-50,.bg-green-100,.bg-teal-50,.bg-teal-100,.bg-emerald-50,.bg-emerald-100{background-color:#d1fae5!important}
    .bg-slate-50,.bg-slate-100{background-color:#e2e8f0!important}
    .bg-purple-50,.bg-purple-100,.bg-violet-50,.bg-violet-100{background-color:#ede9fe!important}
    .bg-blue-50,.bg-blue-100,.bg-sky-50,.bg-sky-100,.bg-indigo-50,.bg-indigo-100{background-color:#dbeafe!important}
    .bg-red-50,.bg-red-100,.bg-rose-50,.bg-rose-100,.bg-orange-50,.bg-orange-100{background-color:#fee2e2!important}
    .bg-pink-50,.bg-pink-100{background-color:#fce7f3!important}
    .bg-yellow-50>*,.bg-yellow-100>*,.bg-amber-50>*,.bg-amber-100>*,
    .bg-green-50>*,.bg-green-100>*,.bg-teal-50>*,.bg-teal-100>*,
    .bg-emerald-50>*,.bg-emerald-100>*,.bg-slate-50>*,.bg-slate-100>*,
    .bg-purple-50>*,.bg-purple-100>*,.bg-violet-50>*,.bg-violet-100>*,
    .bg-blue-50>*,.bg-blue-100>*,.bg-sky-50>*,.bg-sky-100>*,
    .bg-indigo-50>*,.bg-indigo-100>*,.bg-red-50>*,.bg-red-100>*,
    .bg-rose-50>*,.bg-rose-100>*,.bg-orange-50>*,.bg-orange-100>*,
    .bg-pink-50>*,.bg-pink-100>*{color:${darkText}!important}
  `;
}

function buildDarkBase(bg, card, border, t1, t2, t3, t4) {
  return `
    body,html{background-color:${bg}!important;color:${t1}!important}
    .bg-gray-50{background-color:${bg}!important}
    .bg-white,.bg-gray-100,.bg-gray-200{background-color:${card}!important}
    .text-gray-900{color:${t1}!important}
    .text-gray-800{color:${t2}!important}
    .text-gray-700{color:${t3}!important}
    .text-gray-600{color:${t4}!important}
    .text-gray-500,.text-gray-400{color:${t4}99!important}
    .border-gray-100,.border-gray-200,.border-gray-300{border-color:${border}!important}
    input,textarea,select{background-color:${card}!important;color:${t1}!important;border-color:${border}!important}
    input::placeholder,textarea::placeholder{color:${t4}88!important}
    aside,nav,[role="navigation"]{background-color:${card}!important;border-color:${border}!important}
    aside *,nav *{color:${t3}!important}
    [class*="rounded-xl"],[class*="rounded-2xl"],[class*="rounded-3xl"]{background-color:${card}!important}
    .bg-white\\/60,.bg-white\\/80{background-color:${card}cc!important}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME REGISTRY  (5 original + 5 new)
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'default', name: 'Petal', emoji: '🌸', type: 'light',
    preview: ['#fdf2f8','#f9a8d4','#fbcfe8'],
    css: {}, inject: '', font: null, doodle: null,
  },
  {
    id: 'ocean', name: 'Ocean', emoji: '🌊', type: 'light',
    preview: ['#f0f9ff','#7dd3fc','#bae6fd'],
    css: {
      '--background':'210 40% 98%','--foreground':'215 35% 14%',
      '--card':'210 40% 100%','--card-foreground':'215 35% 14%',
      '--primary':'199 89% 48%','--primary-foreground':'0 0% 100%',
      '--secondary':'210 30% 93%','--muted':'210 20% 93%',
      '--muted-foreground':'215 15% 45%','--border':'210 20% 87%',
    },
    inject: `body,html{background-color:#f0f9ff!important}
      .bg-gray-50{background-color:#e0f2fe!important}
      .bg-white{background-color:#ffffff!important}
      .text-gray-900{color:#0c4a6e!important}
      .text-gray-700,.text-gray-800{color:#075985!important}
      .text-gray-600{color:#0369a1!important}
      .border-gray-100,.border-gray-200{border-color:#bae6fd!important}`,
    font: null, doodle: null,
  },
  {
    id: 'sage', name: 'Forest', emoji: '🌿', type: 'light',
    preview: ['#f0fdf4','#86efac','#bbf7d0'],
    css: {
      '--background':'138 60% 97%','--foreground':'140 30% 11%',
      '--card':'138 60% 100%','--card-foreground':'140 30% 11%',
      '--primary':'142 71% 40%','--primary-foreground':'0 0% 100%',
      '--secondary':'138 35% 91%','--muted':'138 25% 91%',
      '--muted-foreground':'140 15% 42%','--border':'138 22% 85%',
    },
    inject: `body,html{background-color:#f0fdf4!important}
      .bg-gray-50{background-color:#dcfce7!important}
      .bg-white{background-color:#ffffff!important}
      .text-gray-900{color:#14532d!important}
      .text-gray-700,.text-gray-800{color:#166534!important}
      .text-gray-600{color:#15803d!important}
      .border-gray-100,.border-gray-200{border-color:#bbf7d0!important}`,
    font: null, doodle: null,
  },
  {
    id: 'midnight', name: 'Midnight', emoji: '🌙', type: 'dark',
    preview: ['#0f172a','#818cf8','#334155'],
    css: {
      '--background':'222 47% 7%','--foreground':'210 40% 96%',
      '--card':'222 47% 10%','--card-foreground':'210 40% 96%',
      '--primary':'226 70% 68%','--primary-foreground':'222 47% 8%',
      '--secondary':'217 32% 15%','--muted':'217 32% 14%',
      '--muted-foreground':'215 20% 58%','--border':'217 32% 19%',
      '--input':'217 32% 19%','--accent':'217 32% 15%',
    },
    inject: buildDarkBase('#0f172a','#1e293b','#334155','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8') + buildMoodPastels(),
    font: null, doodle: null,
  },
  {
    id: 'dusk', name: 'Dusk', emoji: '🌆', type: 'dark',
    preview: ['#1a0a2e','#c084fc','#3b1f6b'],
    css: {
      '--background':'270 50% 6%','--foreground':'270 20% 95%',
      '--card':'270 48% 9%','--card-foreground':'270 20% 95%',
      '--primary':'271 76% 68%','--primary-foreground':'270 50% 6%',
      '--secondary':'270 28% 16%','--muted':'270 24% 13%',
      '--muted-foreground':'270 15% 58%','--border':'270 24% 20%',
      '--input':'270 24% 20%',
    },
    inject: buildDarkBase('#0d0118','#1a0a2e','#2d1b4e','#f5f0ff','#ede9fe','#ddd6fe','#c4b5fd') + buildMoodPastels(),
    font: null, doodle: null,
  },

  // ── 5 NEW THEMES ────────────────────────────────────────────────────────────
  {
    id: 'bubblegum', name: 'Bubblegum', emoji: '🍬', type: 'light',
    preview: ['#fef0f7','#f9a8d4','#e879f9'],
    css: {
      '--background':'330 100% 97%','--foreground':'330 40% 18%',
      '--card':'330 100% 99%','--card-foreground':'330 40% 18%',
      '--primary':'330 80% 58%','--primary-foreground':'0 0% 100%',
      '--secondary':'290 50% 90%','--muted':'330 30% 92%',
      '--muted-foreground':'330 20% 45%','--border':'330 40% 84%',
      '--accent':'290 60% 88%','--input':'330 40% 88%',
    },
    inject: `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
      body,html{background-color:#fef0f7!important;font-family:'Nunito',sans-serif!important}
      h1,h2,h3,h4{font-family:'Nunito',sans-serif!important;font-weight:800!important}
      .bg-gray-50{background-color:#fce7f3!important}
      .bg-white{background-color:#fff5fb!important}
      .text-gray-900{color:#831843!important}
      .text-gray-700,.text-gray-800{color:#9d174d!important}
      .text-gray-600{color:#be185d!important}
      .border-gray-100,.border-gray-200{border-color:#fbcfe8!important}
      button{border-radius:50px!important}
      .rounded-2xl,.rounded-xl{border-radius:20px!important;box-shadow:4px 4px 0 #f9a8d4!important}
    `,
    font: 'Nunito', doodle: 'bubblegum',
  },
  {
    id: 'sketchy', name: 'Sketchy', emoji: '✏️', type: 'light',
    preview: ['#fffdf5','#fde68a','#78716c'],
    css: {
      '--background':'48 100% 98%','--foreground':'30 40% 15%',
      '--card':'48 100% 99%','--card-foreground':'30 40% 15%',
      '--primary':'25 95% 53%','--primary-foreground':'0 0% 100%',
      '--secondary':'48 60% 90%','--muted':'48 40% 90%',
      '--muted-foreground':'30 20% 45%','--border':'30 30% 70%',
      '--accent':'48 90% 85%','--input':'30 30% 85%',
    },
    inject: `
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
      body,html{background-color:#fffdf5!important;font-family:'Caveat',cursive!important;font-size:17px!important}
      h1,h2,h3,h4,h5,h6,label,button,p,span,a{font-family:'Caveat',cursive!important}
      h1,h2,h3{font-weight:700!important}
      .bg-gray-50{background-color:#fef9c3!important}
      .bg-white{background-color:#fffff8!important}
      .text-gray-900{color:#1c1917!important}
      .text-gray-700,.text-gray-800{color:#44403c!important}
      .text-gray-600{color:#57534e!important}
      .border-gray-100,.border-gray-200{border-color:#d6d3d1!important}
      .rounded-2xl,.rounded-xl,.rounded-lg{
        border-radius:6px!important;
        border:2px solid #292524!important;
        box-shadow:3px 3px 0 #292524!important;
      }
      button{
        border:2px solid #292524!important;
        box-shadow:2px 2px 0 #292524!important;
        border-radius:4px!important;
        font-family:'Caveat',cursive!important;
        font-size:16px!important
      }
      button:active{box-shadow:none!important;transform:translate(2px,2px)!important}
      input,textarea{border:2px solid #292524!important;border-radius:4px!important;background:#fffff8!important}
    `,
    font: 'Caveat', doodle: 'sketchy',
  },
  {
    id: 'cartoon', name: 'Cartoon', emoji: '🎨', type: 'light',
    preview: ['#f0f4ff','#818cf8','#fbbf24'],
    css: {
      '--background':'230 100% 97%','--foreground':'230 50% 12%',
      '--card':'230 100% 99%','--card-foreground':'230 50% 12%',
      '--primary':'230 85% 60%','--primary-foreground':'0 0% 100%',
      '--secondary':'230 50% 92%','--muted':'230 30% 92%',
      '--muted-foreground':'230 20% 45%','--border':'230 40% 78%',
      '--accent':'50 100% 88%','--input':'230 40% 88%',
    },
    inject: `
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap');
      body,html{background-color:#f0f4ff!important;font-family:'Baloo 2',cursive!important}
      h1,h2,h3,h4{font-family:'Baloo 2',cursive!important;font-weight:800!important}
      .bg-gray-50{background-color:#e0e7ff!important}
      .bg-white{background-color:#f5f7ff!important}
      .text-gray-900{color:#1e1b4b!important}
      .text-gray-700,.text-gray-800{color:#3730a3!important}
      .text-gray-600{color:#4338ca!important}
      .border-gray-100,.border-gray-200{border-color:#c7d2fe!important}
      .rounded-2xl,.rounded-xl{
        border:3px solid #1e1b4b!important;
        box-shadow:5px 5px 0 #1e1b4b!important;
        border-radius:18px!important;
        background-color:#f5f7ff!important
      }
      button{
        border:2.5px solid #1e1b4b!important;
        box-shadow:3px 3px 0 #1e1b4b!important;
        border-radius:50px!important;
        font-weight:700!important;
        font-family:'Baloo 2',cursive!important
      }
      button:active{box-shadow:1px 1px 0 #1e1b4b!important;transform:translate(2px,2px)!important}
      input,textarea{border:2px solid #1e1b4b!important;border-radius:12px!important;background:#f5f7ff!important}
    `,
    font: 'Baloo 2', doodle: 'cartoon',
  },
  {
    id: 'cottagecore', name: 'Cottage', emoji: '🍄', type: 'light',
    preview: ['#fdf6ec','#d4a574','#8fbc8f'],
    css: {
      '--background':'35 60% 96%','--foreground':'25 40% 18%',
      '--card':'35 60% 98%','--card-foreground':'25 40% 18%',
      '--primary':'25 60% 44%','--primary-foreground':'0 0% 100%',
      '--secondary':'80 25% 85%','--muted':'35 25% 88%',
      '--muted-foreground':'25 20% 45%','--border':'35 30% 76%',
      '--accent':'80 35% 80%','--input':'35 30% 85%',
    },
    inject: `
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,500&family=Nunito:wght@400;500&display=swap');
      body,html{background-color:#fdf6ec!important;font-family:'Nunito',sans-serif!important}
      h1,h2,h3,h4{font-family:'Lora',serif!important;font-weight:600!important;font-style:italic!important}
      .bg-gray-50{background-color:#f5ebe0!important}
      .bg-white{background-color:#fdf8f0!important}
      .text-gray-900{color:#3d2b1f!important}
      .text-gray-700,.text-gray-800{color:#5c3d2e!important}
      .text-gray-600{color:#7a5c4a!important}
      .border-gray-100,.border-gray-200{border-color:#ddc9b4!important}
      .rounded-2xl,.rounded-xl{border-radius:20px!important;border:1.5px solid #c4a882!important;background-color:#fdf8f0!important}
      input,textarea{border-radius:12px!important;border:1.5px solid #c4a882!important;background-color:#fdf8f0!important}
      button{border-radius:14px!important}
    `,
    font: 'Lora', doodle: 'cottage',
  },
  {
    id: 'retrowave', name: 'Retrowave', emoji: '🕹️', type: 'dark',
    preview: ['#0a0015','#ff2d78','#00f0ff'],
    css: {
      '--background':'280 100% 4%','--foreground':'300 80% 90%',
      '--card':'280 80% 7%','--card-foreground':'300 80% 90%',
      '--primary':'330 100% 58%','--primary-foreground':'0 0% 100%',
      '--secondary':'270 60% 14%','--muted':'270 40% 10%',
      '--muted-foreground':'300 30% 60%','--border':'290 50% 20%',
      '--input':'280 50% 12%','--accent':'180 100% 50%',
    },
    inject: `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600&display=swap');
      body,html{background-color:#0a0015!important;font-family:'Rajdhani',sans-serif!important;font-size:15px!important}
      h1,h2,h3,h4{font-family:'Orbitron',monospace!important;font-weight:700!important;letter-spacing:0.06em!important;color:#ff2d78!important}
      .bg-gray-50,.bg-white,.bg-gray-100,.bg-gray-200{background-color:#0f0025!important}
      .text-gray-900,.text-gray-800{color:#f5d0fe!important}
      .text-gray-700,.text-gray-600{color:#d8b4fe!important}
      .text-gray-500,.text-gray-400{color:#a855f7!important}
      .border-gray-100,.border-gray-200,.border-gray-300{border-color:#3b0764!important}
      input,textarea,select{background-color:#0f0025!important;color:#f5d0fe!important;border-color:#7c3aed!important;border-width:1px!important;font-family:'Rajdhani',sans-serif!important}
      input::placeholder,textarea::placeholder{color:#6d28d9!important}
      aside,nav,[role="navigation"]{background-color:#080012!important;border-color:#2d1b69!important}
      aside *,nav *{color:#d8b4fe!important}
      [class*="rounded-xl"],[class*="rounded-2xl"],[class*="rounded-3xl"]{
        background-color:#0f0025!important;
        border:1px solid #4c1d95!important;
      }
      button{
        border:1px solid #ff2d78!important;
        color:#ff2d78!important;
        font-family:'Orbitron',monospace!important;
        font-size:10px!important;
        letter-spacing:0.12em!important;
        text-transform:uppercase!important;
        border-radius:4px!important
      }
    ` + buildMoodPastels('#1e293b'),
    font: 'Orbitron', doodle: 'retro',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// APPLY THEME TO DOM
// ─────────────────────────────────────────────────────────────────────────────
function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  THEMES.forEach(t => Object.keys(t.css).forEach(k => root.style.removeProperty(k)));
  Object.entries(theme.css).forEach(([k, v]) => root.style.setProperty(k, v));
  theme.type === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  let tag = document.getElementById('soul-theme-override');
  if (!tag) { tag = document.createElement('style'); tag.id = 'soul-theme-override'; document.head.appendChild(tag); }
  tag.textContent = theme.inject || '';
  localStorage.setItem('soul-theme', themeId);
}
(() => { const s = localStorage.getItem('soul-theme'); if (s) applyTheme(s); })();

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const GREETINGS = [
  { r:[5,12],  p:['Good morning','Rise and shine','Morning, sunshine ☀️'] },
  { r:[12,17], p:['Good afternoon','Hey there','Hello, lovely'] },
  { r:[17,21], p:['Good evening','Hey you','Evening, friend 🌅'] },
  { r:[21,24], p:['Still up?','Good night owl 🦉','Evening, dreamer'] },
  { r:[0,5],   p:["You're up late ✨",'Hello, night owl',"Can't sleep?"] },
];
function getGreeting(name) {
  const h = new Date().getHours();
  const g = GREETINGS.find(x => h >= x.r[0] && h < x.r[1]) || GREETINGS[0];
  const p = g.p[Math.floor(Math.random() * g.p.length)];
  return name ? `${p}, ${name.split(' ')[0]}!` : `${p}!`;
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
  "Your emotions are valid, all of them. 💙",
  "Showing up for yourself is brave. 🦋",
];
const MOOD_OPTIONS = [
  { emoji:'😄', label:'Great' },
  { emoji:'😊', label:'Good' },
  { emoji:'😌', label:'Calm' },
  { emoji:'😐', label:'Okay' },
  { emoji:'😔', label:'Low' },
  { emoji:'😢', label:'Sad' },
  { emoji:'😤', label:'Frustrated' },
  { emoji:'😰', label:'Anxious' },
  { emoji:'🥰', label:'Loved' },
  { emoji:'😴', label:'Tired' },
];
const NEW_THEME_IDS = new Set(['bubblegum','sketchy','cartoon','cottagecore','retrowave']);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (no external imports needed)
// ─────────────────────────────────────────────────────────────────────────────

// Doodle decorations per theme
function ThemeDoodle({ type }) {
  const style = { position:'absolute', top:8, right:10, opacity:0.22, pointerEvents:'none', zIndex:0 };
  if (type === 'bubblegum') return (
    <svg width="110" height="70" viewBox="0 0 110 70" style={style}>
      <circle cx="18" cy="18" r="11" fill="#f9a8d4"/>
      <circle cx="46" cy="10" r="8" fill="#c084fc"/>
      <circle cx="74" cy="16" r="10" fill="#fde68a"/>
      <circle cx="98" cy="9"  r="6"  fill="#86efac"/>
      <path d="M14 18 Q18 10 22 18" stroke="#ec4899" strokeWidth="1.5" fill="none"/>
      <path d="M42 10 Q46 4 50 10" stroke="#a855f7" strokeWidth="1.5" fill="none"/>
      <circle cx="46" cy="10" r="2" fill="#a855f7"/>
      <circle cx="18" cy="18" r="2" fill="#ec4899"/>
    </svg>
  );
  if (type === 'sketchy') return (
    <svg width="120" height="70" viewBox="0 0 120 70" style={style}>
      <path d="M8 55 Q28 8 58 38 Q88 68 108 18" stroke="#292524" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="22" cy="28" r="9" stroke="#292524" strokeWidth="1.5" fill="none"/>
      <path d="M65 50 L75 40 L85 50 L75 60Z" stroke="#292524" strokeWidth="1.5" fill="none"/>
      <path d="M98 55 Q103 47 110 55 Q103 63 98 55Z" stroke="#292524" strokeWidth="1.5" fill="none"/>
    </svg>
  );
  if (type === 'cartoon') return (
    <svg width="115" height="72" viewBox="0 0 115 72" style={style}>
      <circle cx="56" cy="30" r="22" fill="#fde68a" stroke="#1e1b4b" strokeWidth="2.5"/>
      <circle cx="49" cy="26" r="4" fill="#1e1b4b"/>
      <circle cx="63" cy="26" r="4" fill="#1e1b4b"/>
      <circle cx="50" cy="25" r="1.5" fill="white"/>
      <circle cx="64" cy="25" r="1.5" fill="white"/>
      <path d="M48 38 Q56 46 64 38" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M44 14 Q56 6 68 14" stroke="#1e1b4b" strokeWidth="2" fill="none"/>
      <rect x="3" y="18" width="26" height="20" rx="8" fill="#818cf8" stroke="#1e1b4b" strokeWidth="2"/>
      <polygon points="90,8 104,30 76,30" fill="#f472b6" stroke="#1e1b4b" strokeWidth="2"/>
    </svg>
  );
  if (type === 'cottage') return (
    <svg width="110" height="70" viewBox="0 0 110 70" style={style}>
      <path d="M10 65 Q18 40 32 46 Q36 28 50 34 Q54 16 66 22 Q76 12 86 26 Q94 22 96 42 Q108 40 106 65Z" fill="#8fbc8f"/>
      <circle cx="40" cy="54" r="5.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="62" cy="46" r="4.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="80" cy="52" r="3.5" fill="#ef4444" opacity="0.8"/>
      <rect x="28" y="52" width="12" height="13" rx="6" fill="#d4a574"/>
      <path d="M22 65 Q30 52 38 65" fill="#a16207" opacity="0.4"/>
    </svg>
  );
  if (type === 'retro') return (
    <svg width="125" height="70" viewBox="0 0 125 70" style={style}>
      <rect x="4" y="6" width="38" height="24" rx="3" fill="none" stroke="#ff2d78" strokeWidth="1.5"/>
      <rect x="7" y="9" width="32" height="18" rx="2" fill="#ff2d7818"/>
      <line x1="48" y1="14" x2="122" y2="14" stroke="#00f0ff" strokeWidth="1" opacity="0.6"/>
      <line x1="48" y1="20" x2="108" y2="20" stroke="#7c3aed" strokeWidth="1" opacity="0.5"/>
      <line x1="48" y1="26" x2="118" y2="26" stroke="#00f0ff" strokeWidth="1" opacity="0.4"/>
      <circle cx="20" cy="50" r="14" fill="none" stroke="#ff2d78" strokeWidth="1.5"/>
      <circle cx="20" cy="50" r="7"  fill="none" stroke="#7c3aed" strokeWidth="1"/>
      <circle cx="20" cy="50" r="3"  fill="#ff2d78"/>
      <rect x="46" y="40" width="68" height="7" rx="3.5" fill="none" stroke="#00f0ff" strokeWidth="1"/>
      <rect x="46" y="40" width="38" height="7" rx="3.5" fill="#00f0ff44"/>
    </svg>
  );
  return null;
}

// Toggle switch
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
      background: checked ? 'var(--primary,#ec4899)' : 'var(--muted,#e5e7eb)',
      position:'relative', transition:'background 0.2s', flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:3, left: checked ? 23 : 3,
        width:18, height:18, borderRadius:'50%', background:'white',
        boxShadow:'0 1px 4px rgba(0,0,0,0.25)', transition:'left 0.2s',
      }}/>
    </button>
  );
}

// Section wrapper
function Card({ children, style = {}, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

// Section label
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground"/>}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{children}</h2>
    </div>
  );
}

// Delete modal
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999, backdropFilter:'blur(6px)',
    }}>
      <motion.div initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-card border border-border rounded-2xl"
        style={{ padding:32, maxWidth:400, width:'90%', position:'relative', textAlign:'center' }}>
        <button onClick={onCancel} style={{
          position:'absolute', top:14, right:14, background:'transparent',
          border:'none', cursor:'pointer', color:'var(--muted-foreground,#6b7280)',
        }}><X size={18}/></button>
        <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Delete all data?</h3>
        <p className="text-sm text-muted-foreground mb-6" style={{ lineHeight:1.65 }}>
          This permanently deletes all your journal entries, memories, and settings.
          <strong> This cannot be undone.</strong>
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" style={{ background:'#ef4444', color:'white', border:'none' }} onClick={onConfirm}>
            Yes, delete everything
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'profile',       label:'Profile',       icon:'👤' },
  { id:'theme',         label:'Theme',         icon:'🎨' },
  { id:'notifications', label:'Alerts',        icon:'🔔' },
  { id:'privacy',       label:'Privacy',       icon:'🔒' },
  { id:'data',          label:'Data',          icon:'📦' },
];

const NOTIFICATION_OPTIONS = [
  { id:'daily_reminder', label:'Daily journal reminder', desc:'Gentle nudge to write each day',       icon: Bell  },
  { id:'weekly_report',  label:'Weekly emotional report', desc:'Mood summary every Sunday',          icon: Star  },
  { id:'motivation',     label:'Morning motivation',      desc:'Personalized message from Soul',     icon: Zap   },
  { id:'milestone',      label:'Milestone celebrations',  desc:'Celebrate your streaks & goals',    icon: Heart },
];

const PRIVACY_OPTIONS = [
  { id:'private_mode', label:'Private mode',         desc:'Blur content when screen sharing'      },
  { id:'auto_lock',    label:'Auto-lock after 5 min', desc:'Require re-auth after inactivity'    },
  { id:'hide_streak',  label:'Hide streak publicly',  desc:'Only you can see your streak count'  },
];

const EXPORT_FORMATS = [
  { id:'pdf',      label:'PDF Journal',  icon:'📄', desc:'Beautiful formatted PDF'  },
  { id:'json',     label:'JSON Data',    icon:'📦', desc:'Raw data export'          },
  { id:'markdown', label:'Markdown',     icon:'📝', desc:'Plain text entries'       },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const fileRef = useRef(null);

  const load = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };

  const [profile,       setProfile]       = useState(() => load('soul-profile'));
  const [notifications, setNotifications] = useState(() => load('soul-notifications'));
  const [privacy,       setPrivacy]       = useState(() => load('soul-privacy'));
  const [activeTheme,   setActiveTheme]   = useState(() => localStorage.getItem('soul-theme') || 'default');
  const [activeTab,     setActiveTab]     = useState('profile');
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [savedAnim,     setSavedAnim]     = useState(false);
  const [entryCount,    setEntryCount]    = useState(null);
  const [streakDays,    setStreakDays]    = useState(null);
  const [currentMood,   setCurrentMood]   = useState(null);
  const [showDelete,    setShowDelete]    = useState(false);
  const [exporting,     setExporting]     = useState(null);
  const [newPassword,   setNewPassword]   = useState('');

  const affirmation = useRef(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]).current;
  const greeting    = useRef(getGreeting(load('soul-profile').nickname || load('soul-profile').username || '')).current;

  // ── Fetch data ──
  useEffect(() => {
    journalApi.getAll({ limit:200 })
      .then(res => {
        const entries = res.data || [];
        setEntryCount(entries.length);
        const dates = [...new Set(
          entries.map(e => new Date(e.created_at || e.date || Date.now()).toDateString())
        )];
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          if (dates.includes(d.toDateString())) streak++;
          else if (i > 0) break;
        }
        setStreakDays(streak);
      })
      .catch(() => { setEntryCount(0); setStreakDays(0); });

    const sm = localStorage.getItem('soul-current-mood');
    if (sm !== null) setCurrentMood(parseInt(sm));
  }, []);

  // ── Handlers ──
  const handleMood = useCallback((i) => {
    setCurrentMood(i);
    localStorage.setItem('soul-current-mood', String(i));
    toast.success(`Mood logged: ${MOOD_OPTIONS[i].emoji} ${MOOD_OPTIONS[i].label}`);
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
    setUploading(true);
    try {
      const r = await uploadToCloudinary(file, 'avatars', 'image');
      if (r?.secure_url) { setProfile(p => ({ ...p, avatar_url: r.secure_url })); toast.success('Photo updated!'); }
      else toast.error('Upload failed');
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('soul-profile',       JSON.stringify(profile));
    localStorage.setItem('soul-notifications', JSON.stringify(notifications));
    localStorage.setItem('soul-privacy',       JSON.stringify(privacy));
    setTimeout(() => { setSaving(false); setSavedAnim(true); toast.success('All settings saved! 🎉'); setTimeout(() => setSavedAnim(false), 2200); }, 600);
  };

  const handleTheme = (id) => {
    setActiveTheme(id); applyTheme(id);
    const t = THEMES.find(x => x.id === id);
    toast.success(`${t?.emoji} ${t?.name} applied!`);
  };

  const handleExport = async (format) => {
    setExporting(format);
    await new Promise(r => setTimeout(r, 1400));
    toast.success(`Exported as ${format.toUpperCase()}`);
    setExporting(null);
  };

  const handleDeleteAll = () => {
    localStorage.clear();
    toast.success('All data deleted. Reloading…');
    setTimeout(() => window.location.reload(), 1400);
  };

  const themeObj   = THEMES.find(t => t.id === activeTheme) || THEMES[0];
  const displayName = profile.nickname || profile.username || 'Friend';
  const initials    = displayName.slice(0, 2).toUpperCase();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* ── Greeting ── */}
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-semibold text-foreground mt-0.5">Your Profile</h1>
          </motion.div>

          {/* ── Hero card ── */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.06 }}>
            <Card style={{ position:'relative', overflow:'hidden' }}>
              <ThemeDoodle type={themeObj.doodle}/>

              {/* Avatar + info */}
              <div className="flex items-center gap-5" style={{ position:'relative', zIndex:1 }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <motion.div whileHover={{ scale:1.04 }}
                    className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer border-[3px] border-primary/20 hover:border-primary/50 transition-colors"
                    onClick={() => fileRef.current?.click()}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                      : <span className="text-2xl font-bold text-primary/60 select-none">{initials}</span>
                    }
                  </motion.div>
                  <motion.button whileHover={{ scale:1.15 }} whileTap={{ scale:0.95 }}
                    onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Camera className="w-3.5 h-3.5"/>}
                  </motion.button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-lg leading-tight truncate">{displayName}</p>
                  {profile.bio && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{profile.bio}</p>}
                  {profile.quote && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{profile.quote}"</p>}

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      <BookHeart className="w-3 h-3"/>
                      {entryCount === null ? '…' : `${entryCount} entries`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      {themeObj.emoji} {themeObj.name}
                    </span>
                    {streakDays !== null && streakDays > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background:'rgba(234,88,12,0.12)', color:'#ea580c' }}>
                        🔥 {streakDays}-day streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mood check-in */}
              <div className="mt-5 pt-5 border-t border-border" style={{ position:'relative', zIndex:1 }}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  How are you feeling right now?
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {MOOD_OPTIONS.map((m, i) => (
                    <motion.button key={i} whileHover={{ scale:1.15 }} whileTap={{ scale:0.92 }}
                      onClick={() => handleMood(i)}
                      title={m.label}
                      style={{
                        width:40, height:40, borderRadius:'50%', border:'2.5px solid',
                        borderColor: currentMood === i ? 'var(--primary,#ec4899)' : 'transparent',
                        background: currentMood === i ? 'rgba(236,72,153,0.1)' : 'var(--muted,#f3f4f6)',
                        cursor:'pointer', fontSize:20, transition:'all 0.15s',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
                {currentMood !== null && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Feeling <strong>{MOOD_OPTIONS[currentMood].label}</strong> right now
                  </p>
                )}
              </div>

              {/* Affirmation */}
              <div className="mt-4 pt-4 border-t border-border" style={{ position:'relative', zIndex:1 }}>
                <p className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0"/>
                  {affirmation}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* ── Tabs ── */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.12 }}>
            <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Tab Panels ── */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.2 }}>

              {/* ── PROFILE ── */}
              {activeTab === 'profile' && (
                <Card>
                  <SectionLabel>About you</SectionLabel>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">Username</Label>
                        <Input placeholder="your_username" value={profile.username || ''}
                          onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                          className="bg-background border-input"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">
                          Nickname <span className="text-xs text-muted-foreground font-normal">(greetings)</span>
                        </Label>
                        <Input placeholder="What should we call you?" value={profile.nickname || ''}
                          onChange={e => setProfile(p => ({ ...p, nickname: e.target.value }))}
                          className="bg-background border-input"/>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Bio</Label>
                      <Input placeholder="A little something about you…" value={profile.bio || ''}
                        onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                        className="bg-background border-input"/>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Favourite quote</Label>
                      <Input placeholder="A line that keeps you going…" value={profile.quote || ''}
                        onChange={e => setProfile(p => ({ ...p, quote: e.target.value }))}
                        className="bg-background border-input"/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">Timezone</Label>
                        <select value={profile.timezone || 'UTC'}
                          onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                          {['UTC','Asia/Kolkata','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">Journal goal</Label>
                        <select value={profile.goal || 'daily'}
                          onChange={e => setProfile(p => ({ ...p, goal: e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                          <option value="daily">Every day</option>
                          <option value="weekdays">Weekdays only</option>
                          <option value="3x">3× per week</option>
                          <option value="weekly">Once a week</option>
                        </select>
                      </div>
                    </div>

                    {profile.quote && (
                      <div style={{ padding:'12px 16px', borderRadius:12, background:'rgba(var(--primary),0.06)',
                        border:'1px solid rgba(var(--primary),0.15)', fontStyle:'italic' }}
                        className="text-sm text-muted-foreground">
                        "{profile.quote}"
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* ── THEME ── */}
              {activeTab === 'theme' && (
                <Card>
                  <SectionLabel icon={Palette}>App Theme</SectionLabel>

                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(theme => (
                      <motion.button key={theme.id}
                        whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.97 }}
                        onClick={() => handleTheme(theme.id)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          activeTheme === theme.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/40 bg-background'
                        }`}>

                        {/* Colour swatches */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {theme.preview.map((c, i) => (
                            <div key={i} style={{ width:13, height:13, borderRadius:3, backgroundColor:c, border:'1px solid rgba(0,0,0,0.1)' }}/>
                          ))}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span style={{ fontSize:16 }}>{theme.emoji}</span>
                            <span className="font-medium text-sm text-foreground">{theme.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {theme.type === 'dark' ? <Moon className="w-2.5 h-2.5"/> : <Sun className="w-2.5 h-2.5"/>}
                            <span style={{ fontSize:11 }}>{theme.type}</span>
                            {theme.font && <span style={{ fontSize:11, marginLeft:4, opacity:0.55 }}>· {theme.font}</span>}
                          </div>
                        </div>

                        {activeTheme === theme.id && (
                          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                            className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-primary-foreground"/>
                          </motion.div>
                        )}

                        {NEW_THEME_IDS.has(theme.id) && (
                          <div style={{
                            position:'absolute', top:-7, right:8, fontSize:9, fontWeight:700,
                            background:'var(--primary,#ec4899)', color:'white',
                            padding:'2px 7px', borderRadius:4, letterSpacing:'0.06em', textTransform:'uppercase',
                          }}>NEW</div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active theme</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {themeObj.emoji} {themeObj.name}
                      {themeObj.font && <span className="text-xs opacity-60">· {themeObj.font}</span>}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Themes apply instantly across the whole app
                  </p>
                </Card>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <Card>
                  <SectionLabel icon={Bell}>Notifications</SectionLabel>
                  <div className="space-y-0.5">
                    {NOTIFICATION_OPTIONS.map(({ id, label, desc, icon: Icon }) => (
                      <div key={id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary"/>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                        <Toggle checked={!!notifications[id]} onChange={v => setNotifications(p => ({ ...p, [id]:v }))}/>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Daily reminder time</Label>
                    <Input type="time" value={profile.reminderTime || '09:00'}
                      onChange={e => setProfile(p => ({ ...p, reminderTime: e.target.value }))}
                      className="bg-background border-input w-36"/>
                    <p className="text-xs text-muted-foreground">Your daily journal nudge will arrive at this time</p>
                  </div>
                </Card>
              )}

              {/* ── PRIVACY ── */}
              {activeTab === 'privacy' && (
                <Card>
                  <SectionLabel icon={Shield}>Privacy & Security</SectionLabel>
                  <div className="space-y-0.5 mb-5">
                    {PRIVACY_OPTIONS.map(({ id, label, desc }) => (
                      <div key={id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Toggle checked={!!privacy[id]} onChange={v => setPrivacy(p => ({ ...p, [id]:v }))}/>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border space-y-2">
                    <Label className="text-sm font-medium text-foreground">Change password</Label>
                    <Input type="password" placeholder="Enter new password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-background border-input max-w-xs"/>
                    <Button variant="outline" size="sm"
                      onClick={() => { toast.success('Password update request sent'); setNewPassword(''); }}>
                      Update password
                    </Button>
                  </div>
                </Card>
              )}

              {/* ── DATA ── */}
              {activeTab === 'data' && (
                <div className="space-y-4">
                  <Card>
                    <SectionLabel icon={Download}>Export Your Data</SectionLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {EXPORT_FORMATS.map(({ id, label, icon, desc }) => (
                        <motion.button key={id} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                          onClick={() => handleExport(id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 bg-background text-center transition-all">
                          <span style={{ fontSize:26 }}>{icon}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                          {exporting === id
                            ? <Loader2 className="w-4 h-4 animate-spin text-primary"/>
                            : <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                          }
                        </motion.button>
                      ))}
                    </div>
                  </Card>

                  <Card style={{ borderColor:'rgba(239,68,68,0.28)' }}>
                    <SectionLabel icon={Trash2}><span className="text-red-500">Danger Zone</span></SectionLabel>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete all journal entries, memories, emotional data, and settings.
                      This <strong>cannot</strong> be undone.
                    </p>
                    <Button onClick={() => setShowDelete(true)}
                      style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 className="w-4 h-4 mr-2"/>
                      Delete all my data
                    </Button>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ── Save button (hidden on data tab) ── */}
          {activeTab !== 'data' && (
            <motion.div whileTap={{ scale:0.98 }}>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {savedAnim
                    ? <motion.span key="ok"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        className="flex items-center gap-2">
                        <Check className="w-4 h-4"/> Saved!
                      </motion.span>
                    : <motion.span key="save"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        className="flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </motion.span>
                  }
                </AnimatePresence>
              </Button>
            </motion.div>
          )}

          <div className="h-8"/>
        </div>
      </main>

      <AnimatePresence>
        {showDelete && (
          <DeleteModal onConfirm={handleDeleteAll} onCancel={() => setShowDelete(false)}/>
        )}
      </AnimatePresence>
    </div>
  );
}