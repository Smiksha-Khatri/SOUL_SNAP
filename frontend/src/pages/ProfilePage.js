/**
 * ProfilePage.js — Soul Snap
 * Complete rewrite with robust theme engine + 12 themes
 *
 * THEME ENGINE FIX:
 * Instead of fighting Tailwind's !important specificity war, we set
 * data-theme="<id>" on <html> and write CSS rules scoped to that attribute.
 * A single <style id="soul-snap-themes"> tag holds ALL theme rules at once.
 * This makes switching instant (just change the attribute), avoids stale
 * inject leftovers, and wins the specificity battle cleanly.
 */

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
  ChevronRight, Star, Zap, Heart, X, Music, Gamepad2
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// MASTER THEME STYLESHEET
// Injected once into <head>. Each theme is scoped to html[data-theme="id"].
// This beats specificity issues because attribute selectors have the same
// specificity as class selectors — and we add !important as a backstop.
// ─────────────────────────────────────────────────────────────────────────────
const MASTER_THEME_CSS = `
/* ── Fonts ─────────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Caveat:wght@400;600;700&family=Baloo+2:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600&family=Fredoka+One&family=Quicksand:wght@400;500;600;700&display=swap');

/* ── Shared pastels fix (dark themes) ──────────────────────────────────────── */
html[data-theme="midnight"] .bg-yellow-50,html[data-theme="midnight"] .bg-yellow-100,
html[data-theme="midnight"] .bg-amber-50,html[data-theme="midnight"] .bg-amber-100,
html[data-theme="dusk"] .bg-yellow-50,html[data-theme="dusk"] .bg-yellow-100,
html[data-theme="dusk"] .bg-amber-50,html[data-theme="dusk"] .bg-amber-100,
html[data-theme="retrowave"] .bg-yellow-50,html[data-theme="retrowave"] .bg-yellow-100,
html[data-theme="retrowave"] .bg-amber-50,html[data-theme="retrowave"] .bg-amber-100
{ background-color:#fef9c3 !important; }

html[data-theme="midnight"] .bg-green-50,html[data-theme="midnight"] .bg-green-100,
html[data-theme="midnight"] .bg-teal-50,html[data-theme="midnight"] .bg-teal-100,
html[data-theme="dusk"] .bg-green-50,html[data-theme="dusk"] .bg-green-100,
html[data-theme="dusk"] .bg-teal-50,html[data-theme="dusk"] .bg-teal-100,
html[data-theme="retrowave"] .bg-green-50,html[data-theme="retrowave"] .bg-green-100
{ background-color:#d1fae5 !important; }

html[data-theme="midnight"] .bg-slate-50,html[data-theme="midnight"] .bg-slate-100,
html[data-theme="dusk"] .bg-slate-50,html[data-theme="dusk"] .bg-slate-100,
html[data-theme="retrowave"] .bg-slate-50,html[data-theme="retrowave"] .bg-slate-100
{ background-color:#e2e8f0 !important; }

html[data-theme="midnight"] .bg-purple-50,html[data-theme="midnight"] .bg-violet-50,
html[data-theme="dusk"] .bg-purple-50,html[data-theme="dusk"] .bg-violet-50,
html[data-theme="retrowave"] .bg-purple-50,html[data-theme="retrowave"] .bg-violet-50
{ background-color:#ede9fe !important; }

html[data-theme="midnight"] .bg-blue-50,html[data-theme="midnight"] .bg-sky-50,
html[data-theme="midnight"] .bg-indigo-50,
html[data-theme="dusk"] .bg-blue-50,html[data-theme="dusk"] .bg-sky-50,
html[data-theme="retrowave"] .bg-blue-50,html[data-theme="retrowave"] .bg-sky-50
{ background-color:#dbeafe !important; }

html[data-theme="midnight"] .bg-red-50,html[data-theme="midnight"] .bg-rose-50,
html[data-theme="midnight"] .bg-orange-50,
html[data-theme="dusk"] .bg-red-50,html[data-theme="dusk"] .bg-rose-50,
html[data-theme="retrowave"] .bg-red-50,html[data-theme="retrowave"] .bg-rose-50
{ background-color:#fee2e2 !important; }

/* Force dark text inside pastel mood cards (direct children only) */
html[data-theme="midnight"] .bg-yellow-50 > *,html[data-theme="midnight"] .bg-amber-50 > *,
html[data-theme="midnight"] .bg-green-50 > *,html[data-theme="midnight"] .bg-teal-50 > *,
html[data-theme="midnight"] .bg-slate-50 > *,html[data-theme="midnight"] .bg-purple-50 > *,
html[data-theme="midnight"] .bg-blue-50 > *,html[data-theme="midnight"] .bg-sky-50 > *,
html[data-theme="midnight"] .bg-red-50 > *,html[data-theme="midnight"] .bg-rose-50 > *,
html[data-theme="dusk"] .bg-yellow-50 > *,html[data-theme="dusk"] .bg-amber-50 > *,
html[data-theme="dusk"] .bg-green-50 > *,html[data-theme="dusk"] .bg-teal-50 > *,
html[data-theme="dusk"] .bg-slate-50 > *,html[data-theme="dusk"] .bg-purple-50 > *,
html[data-theme="dusk"] .bg-blue-50 > *,html[data-theme="dusk"] .bg-sky-50 > *,
html[data-theme="dusk"] .bg-red-50 > *,html[data-theme="dusk"] .bg-rose-50 > *,
html[data-theme="retrowave"] .bg-yellow-50 > *,html[data-theme="retrowave"] .bg-red-50 > *
{ color: #1e293b !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MIDNIGHT                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="midnight"],
html[data-theme="midnight"] body
{ background-color:#0f172a !important; color:#e2e8f0 !important; }

html[data-theme="midnight"] :is(.bg-white, .bg-gray-50, .bg-gray-100, .bg-background, [class*="bg-card"])
{ background-color:#1e293b !important; }

html[data-theme="midnight"] :is(.bg-gray-200, .bg-muted)
{ background-color:#334155 !important; }

html[data-theme="midnight"] :is(.text-gray-900, .text-foreground)   { color:#f1f5f9 !important; }
html[data-theme="midnight"] :is(.text-gray-800)                     { color:#e2e8f0 !important; }
html[data-theme="midnight"] :is(.text-gray-700, .text-gray-600)     { color:#cbd5e1 !important; }
html[data-theme="midnight"] :is(.text-muted-foreground, .text-gray-500) { color:#94a3b8 !important; }
html[data-theme="midnight"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#334155 !important; }

html[data-theme="midnight"] input,
html[data-theme="midnight"] textarea,
html[data-theme="midnight"] select
{ background-color:#1e293b !important; color:#f1f5f9 !important; border-color:#334155 !important; }

html[data-theme="midnight"] input::placeholder,
html[data-theme="midnight"] textarea::placeholder
{ color:#64748b !important; }

html[data-theme="midnight"] aside,
html[data-theme="midnight"] nav,
html[data-theme="midnight"] [role="navigation"]
{ background-color:#1e293b !important; border-color:#334155 !important; }

html[data-theme="midnight"] aside *,
html[data-theme="midnight"] nav *
{ color:#cbd5e1 !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* DUSK                                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="dusk"],
html[data-theme="dusk"] body
{ background-color:#0d0118 !important; color:#f5f0ff !important; }

html[data-theme="dusk"] :is(.bg-white, .bg-gray-50, .bg-gray-100, .bg-background, [class*="bg-card"])
{ background-color:#1a0a2e !important; }

html[data-theme="dusk"] :is(.bg-gray-200, .bg-muted)
{ background-color:#2d1b4e !important; }

html[data-theme="dusk"] :is(.text-gray-900, .text-foreground)       { color:#f5f0ff !important; }
html[data-theme="dusk"] :is(.text-gray-800)                         { color:#ede9fe !important; }
html[data-theme="dusk"] :is(.text-gray-700, .text-gray-600)         { color:#ddd6fe !important; }
html[data-theme="dusk"] :is(.text-muted-foreground, .text-gray-500) { color:#a78bfa !important; }
html[data-theme="dusk"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#2d1b4e !important; }

html[data-theme="dusk"] input,
html[data-theme="dusk"] textarea,
html[data-theme="dusk"] select
{ background-color:#1a0a2e !important; color:#f5f0ff !important; border-color:#2d1b4e !important; }

html[data-theme="dusk"] input::placeholder,
html[data-theme="dusk"] textarea::placeholder
{ color:#6d28d9 !important; }

html[data-theme="dusk"] aside,
html[data-theme="dusk"] nav,
html[data-theme="dusk"] [role="navigation"]
{ background-color:#1a0a2e !important; border-color:#2d1b4e !important; }

html[data-theme="dusk"] aside *,
html[data-theme="dusk"] nav *
{ color:#ddd6fe !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* RETROWAVE                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="retrowave"],
html[data-theme="retrowave"] body
{ background-color:#0a0015 !important; color:#f5d0fe !important;
  font-family:'Rajdhani',sans-serif !important; }

html[data-theme="retrowave"] :is(h1, h2, h3, h4, h5)
{ font-family:'Orbitron',monospace !important; font-weight:700 !important;
  letter-spacing:0.06em !important; color:#ff2d78 !important; }

html[data-theme="retrowave"] :is(.bg-white, .bg-gray-50, .bg-gray-100, .bg-background, [class*="bg-card"])
{ background-color:#0f0025 !important; border-color:#3b0764 !important; }

html[data-theme="retrowave"] :is(.bg-gray-200, .bg-muted)
{ background-color:#1a0040 !important; }

html[data-theme="retrowave"] :is(.text-gray-900, .text-foreground)       { color:#f5d0fe !important; }
html[data-theme="retrowave"] :is(.text-gray-800, .text-gray-700)         { color:#e9d5ff !important; }
html[data-theme="retrowave"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#a855f7 !important; }
html[data-theme="retrowave"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#3b0764 !important; }

html[data-theme="retrowave"] input,
html[data-theme="retrowave"] textarea,
html[data-theme="retrowave"] select
{ background-color:#0f0025 !important; color:#f5d0fe !important;
  border-color:#7c3aed !important; font-family:'Rajdhani',sans-serif !important; }

html[data-theme="retrowave"] input::placeholder,
html[data-theme="retrowave"] textarea::placeholder
{ color:#6d28d9 !important; }

html[data-theme="retrowave"] aside,
html[data-theme="retrowave"] nav,
html[data-theme="retrowave"] [role="navigation"]
{ background-color:#080012 !important; border-color:#2d1b69 !important; }

html[data-theme="retrowave"] aside *,
html[data-theme="retrowave"] nav *
{ color:#d8b4fe !important; }

html[data-theme="retrowave"] button:not([class*="bg-primary"]):not([class*="bg-red"])
{ border:1px solid #ff2d78 !important; color:#ff2d78 !important;
  font-family:'Orbitron',monospace !important; font-size:10px !important;
  letter-spacing:0.12em !important; text-transform:uppercase !important; border-radius:4px !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* BUBBLEGUM                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="bubblegum"],
html[data-theme="bubblegum"] body
{ background-color:#fef0f7 !important; font-family:'Nunito',sans-serif !important; }

html[data-theme="bubblegum"] :is(h1, h2, h3, h4)
{ font-family:'Nunito',sans-serif !important; font-weight:800 !important; }

html[data-theme="bubblegum"] :is(.bg-white, .bg-background)
{ background-color:#fff5fb !important; }

html[data-theme="bubblegum"] :is(.bg-gray-50, .bg-muted)
{ background-color:#fce7f3 !important; }

html[data-theme="bubblegum"] :is(.text-gray-900, .text-foreground)   { color:#831843 !important; }
html[data-theme="bubblegum"] :is(.text-gray-700, .text-gray-800)     { color:#9d174d !important; }
html[data-theme="bubblegum"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#be185d !important; }
html[data-theme="bubblegum"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#fbcfe8 !important; }

html[data-theme="bubblegum"] .rounded-2xl,
html[data-theme="bubblegum"] .rounded-xl
{ box-shadow: 4px 4px 0 #f9a8d4 !important; }

html[data-theme="bubblegum"] button
{ border-radius:50px !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SKETCHY                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="sketchy"],
html[data-theme="sketchy"] body
{ background-color:#fffdf5 !important; font-family:'Caveat',cursive !important; font-size:17px !important; }

html[data-theme="sketchy"] :is(h1,h2,h3,h4,button,label,p,span,a)
{ font-family:'Caveat',cursive !important; }

html[data-theme="sketchy"] :is(h1,h2,h3)
{ font-weight:700 !important; }

html[data-theme="sketchy"] :is(.bg-white, .bg-background)
{ background-color:#fffff8 !important; }

html[data-theme="sketchy"] :is(.bg-gray-50, .bg-muted)
{ background-color:#fef9c3 !important; }

html[data-theme="sketchy"] :is(.text-gray-900, .text-foreground)   { color:#1c1917 !important; }
html[data-theme="sketchy"] :is(.text-gray-700, .text-gray-800)     { color:#44403c !important; }
html[data-theme="sketchy"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#78716c !important; }
html[data-theme="sketchy"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#d6d3d1 !important; }

html[data-theme="sketchy"] .rounded-2xl,
html[data-theme="sketchy"] .rounded-xl,
html[data-theme="sketchy"] .rounded-lg
{ border-radius:6px !important; border:2px solid #292524 !important; box-shadow:3px 3px 0 #292524 !important; }

html[data-theme="sketchy"] button
{ border:2px solid #292524 !important; box-shadow:2px 2px 0 #292524 !important;
  border-radius:4px !important; font-family:'Caveat',cursive !important; font-size:16px !important; }

html[data-theme="sketchy"] button:active
{ box-shadow:none !important; transform:translate(2px,2px) !important; }

html[data-theme="sketchy"] input,
html[data-theme="sketchy"] textarea
{ border:2px solid #292524 !important; border-radius:4px !important; background:#fffff8 !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* CARTOON                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="cartoon"],
html[data-theme="cartoon"] body
{ background-color:#f0f4ff !important; font-family:'Baloo 2',cursive !important; }

html[data-theme="cartoon"] :is(h1,h2,h3,h4)
{ font-family:'Baloo 2',cursive !important; font-weight:800 !important; }

html[data-theme="cartoon"] :is(.bg-white, .bg-background)
{ background-color:#f5f7ff !important; }

html[data-theme="cartoon"] :is(.bg-gray-50, .bg-muted)
{ background-color:#e0e7ff !important; }

html[data-theme="cartoon"] :is(.text-gray-900, .text-foreground)   { color:#1e1b4b !important; }
html[data-theme="cartoon"] :is(.text-gray-700, .text-gray-800)     { color:#3730a3 !important; }
html[data-theme="cartoon"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#4338ca !important; }
html[data-theme="cartoon"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#c7d2fe !important; }

html[data-theme="cartoon"] .rounded-2xl,
html[data-theme="cartoon"] .rounded-xl
{ border:3px solid #1e1b4b !important; box-shadow:5px 5px 0 #1e1b4b !important; border-radius:18px !important; }

html[data-theme="cartoon"] button
{ border:2.5px solid #1e1b4b !important; box-shadow:3px 3px 0 #1e1b4b !important;
  border-radius:50px !important; font-weight:700 !important; font-family:'Baloo 2',cursive !important; }

html[data-theme="cartoon"] button:active
{ box-shadow:1px 1px 0 #1e1b4b !important; transform:translate(2px,2px) !important; }

html[data-theme="cartoon"] input,
html[data-theme="cartoon"] textarea
{ border:2px solid #1e1b4b !important; border-radius:12px !important; background:#f5f7ff !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* COTTAGECORE                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="cottagecore"],
html[data-theme="cottagecore"] body
{ background-color:#fdf6ec !important; font-family:'Nunito',sans-serif !important; }

html[data-theme="cottagecore"] :is(h1,h2,h3,h4)
{ font-family:'Lora',serif !important; font-weight:600 !important; font-style:italic !important; }

html[data-theme="cottagecore"] :is(.bg-white, .bg-background)
{ background-color:#fdf8f0 !important; }

html[data-theme="cottagecore"] :is(.bg-gray-50, .bg-muted)
{ background-color:#f5ebe0 !important; }

html[data-theme="cottagecore"] :is(.text-gray-900, .text-foreground)   { color:#3d2b1f !important; }
html[data-theme="cottagecore"] :is(.text-gray-700, .text-gray-800)     { color:#5c3d2e !important; }
html[data-theme="cottagecore"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#92694e !important; }
html[data-theme="cottagecore"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#ddc9b4 !important; }

html[data-theme="cottagecore"] .rounded-2xl,
html[data-theme="cottagecore"] .rounded-xl
{ border-radius:20px !important; border:1.5px solid #c4a882 !important; background-color:#fdf8f0 !important; }

html[data-theme="cottagecore"] input,
html[data-theme="cottagecore"] textarea
{ border-radius:12px !important; border:1.5px solid #c4a882 !important; background-color:#fdf8f0 !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* GAMER BOY  🎮                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="gamerboy"],
html[data-theme="gamerboy"] body
{ background-color:#0d1117 !important; color:#c9d1d9 !important;
  font-family:'Rajdhani',sans-serif !important; font-size:15px !important; }

html[data-theme="gamerboy"] :is(h1,h2,h3,h4)
{ font-family:'Orbitron',monospace !important; font-weight:700 !important;
  color:#00ff88 !important; letter-spacing:0.05em !important; }

html[data-theme="gamerboy"] :is(.bg-white, .bg-gray-50, .bg-gray-100, .bg-background, [class*="bg-card"])
{ background-color:#161b22 !important; }

html[data-theme="gamerboy"] :is(.bg-gray-200, .bg-muted)
{ background-color:#21262d !important; }

html[data-theme="gamerboy"] :is(.text-gray-900, .text-foreground)   { color:#f0f6fc !important; }
html[data-theme="gamerboy"] :is(.text-gray-800, .text-gray-700)     { color:#c9d1d9 !important; }
html[data-theme="gamerboy"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#8b949e !important; }
html[data-theme="gamerboy"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#30363d !important; }

html[data-theme="gamerboy"] input,
html[data-theme="gamerboy"] textarea,
html[data-theme="gamerboy"] select
{ background-color:#161b22 !important; color:#c9d1d9 !important;
  border-color:#30363d !important; font-family:'Rajdhani',sans-serif !important; }

html[data-theme="gamerboy"] input::placeholder,
html[data-theme="gamerboy"] textarea::placeholder
{ color:#484f58 !important; }

html[data-theme="gamerboy"] aside,
html[data-theme="gamerboy"] nav,
html[data-theme="gamerboy"] [role="navigation"]
{ background-color:#0d1117 !important; border-color:#30363d !important; }

html[data-theme="gamerboy"] aside *,
html[data-theme="gamerboy"] nav *
{ color:#8b949e !important; }

html[data-theme="gamerboy"] .rounded-2xl,
html[data-theme="gamerboy"] .rounded-xl
{ border:1px solid #00ff8844 !important;
  box-shadow:0 0 18px rgba(0,255,136,0.08) !important; }

html[data-theme="gamerboy"] button:not([class*="bg-red"])
{ border:1px solid #00ff88 !important; color:#00ff88 !important;
  font-family:'Orbitron',monospace !important; font-size:10px !important;
  letter-spacing:0.1em !important; text-transform:uppercase !important; border-radius:6px !important; }

/* pastels for gamerboy dark */
html[data-theme="gamerboy"] .bg-yellow-50,html[data-theme="gamerboy"] .bg-amber-50
{ background-color:#fef9c3 !important; }
html[data-theme="gamerboy"] .bg-yellow-50 > *,html[data-theme="gamerboy"] .bg-amber-50 > *
{ color:#1e293b !important; }
html[data-theme="gamerboy"] .bg-red-50,html[data-theme="gamerboy"] .bg-rose-50
{ background-color:#fee2e2 !important; }
html[data-theme="gamerboy"] .bg-red-50 > *,html[data-theme="gamerboy"] .bg-rose-50 > *
{ color:#1e293b !important; }
html[data-theme="gamerboy"] .bg-blue-50,html[data-theme="gamerboy"] .bg-sky-50
{ background-color:#dbeafe !important; }
html[data-theme="gamerboy"] .bg-blue-50 > *,html[data-theme="gamerboy"] .bg-sky-50 > *
{ color:#1e293b !important; }
html[data-theme="gamerboy"] .bg-green-50,html[data-theme="gamerboy"] .bg-teal-50
{ background-color:#d1fae5 !important; }
html[data-theme="gamerboy"] .bg-green-50 > *,html[data-theme="gamerboy"] .bg-teal-50 > *
{ color:#1e293b !important; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ANIME GIRL  🌸                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
html[data-theme="animegirl"],
html[data-theme="animegirl"] body
{ background-color:#fff0f8 !important; font-family:'Quicksand',sans-serif !important; }

html[data-theme="animegirl"] :is(h1,h2,h3,h4)
{ font-family:'Fredoka One',cursive !important; font-weight:400 !important;
  letter-spacing:0.03em !important; color:#d63384 !important; }

html[data-theme="animegirl"] :is(.bg-white, .bg-background)
{ background-color:#fff8fc !important; }

html[data-theme="animegirl"] :is(.bg-gray-50, .bg-muted)
{ background-color:#ffe4f2 !important; }

html[data-theme="animegirl"] :is(.text-gray-900, .text-foreground)   { color:#7c1f5a !important; }
html[data-theme="animegirl"] :is(.text-gray-800, .text-gray-700)     { color:#9d2b73 !important; }
html[data-theme="animegirl"] :is(.text-muted-foreground, .text-gray-500, .text-gray-600) { color:#c44f94 !important; }
html[data-theme="animegirl"] :is(.border-gray-100, .border-gray-200, .border-border) { border-color:#fbb6d6 !important; }

html[data-theme="animegirl"] input,
html[data-theme="animegirl"] textarea,
html[data-theme="animegirl"] select
{ background-color:#fff0f8 !important; color:#7c1f5a !important;
  border-color:#fbb6d6 !important; font-family:'Quicksand',sans-serif !important; }

html[data-theme="animegirl"] input::placeholder,
html[data-theme="animegirl"] textarea::placeholder
{ color:#e899c5 !important; }

html[data-theme="animegirl"] aside,
html[data-theme="animegirl"] nav,
html[data-theme="animegirl"] [role="navigation"]
{ background-color:#fff0f8 !important; border-color:#fbb6d6 !important; }

html[data-theme="animegirl"] aside *,
html[data-theme="animegirl"] nav *
{ color:#c44f94 !important; }

html[data-theme="animegirl"] .rounded-2xl,
html[data-theme="animegirl"] .rounded-xl
{ border-radius:24px !important;
  border:2px solid #fbb6d6 !important;
  box-shadow:4px 4px 0 #fce7f3 !important;
  background-color:#fff8fc !important; }

html[data-theme="animegirl"] button
{ border-radius:50px !important;
  font-family:'Quicksand',sans-serif !important;
  font-weight:700 !important; }

html[data-theme="animegirl"] input,
html[data-theme="animegirl"] textarea
{ border-radius:16px !important; }
`;

// Inject the master stylesheet once
function injectMasterStyles() {
  const id = 'soul-snap-master-themes';
  if (!document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = MASTER_THEME_CSS;
    document.head.appendChild(tag);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = [
  { id:'default',     name:'Petal',      emoji:'🌸', type:'light', preview:['#fdf2f8','#f9a8d4','#fbcfe8'], font:null,           css:{ '--primary':'330 70% 60%', '--primary-foreground':'0 0% 100%' } },
  { id:'ocean',       name:'Ocean',      emoji:'🌊', type:'light', preview:['#f0f9ff','#7dd3fc','#bae6fd'], font:null,           css:{ '--background':'210 40% 98%','--foreground':'215 35% 14%','--primary':'199 89% 48%','--primary-foreground':'0 0% 100%','--border':'210 20% 87%','--muted':'210 20% 93%','--muted-foreground':'215 15% 45%' } },
  { id:'sage',        name:'Forest',     emoji:'🌿', type:'light', preview:['#f0fdf4','#86efac','#bbf7d0'], font:null,           css:{ '--background':'138 60% 97%','--foreground':'140 30% 11%','--primary':'142 71% 40%','--primary-foreground':'0 0% 100%','--border':'138 22% 85%','--muted':'138 25% 91%','--muted-foreground':'140 15% 42%' } },
  { id:'midnight',    name:'Midnight',   emoji:'🌙', type:'dark',  preview:['#0f172a','#818cf8','#334155'], font:null,           css:{ '--background':'222 47% 7%','--foreground':'210 40% 96%','--card':'222 47% 10%','--primary':'226 70% 68%','--primary-foreground':'222 47% 8%','--border':'217 32% 19%','--muted':'217 32% 14%','--muted-foreground':'215 20% 58%' } },
  { id:'dusk',        name:'Dusk',       emoji:'🌆', type:'dark',  preview:['#1a0a2e','#c084fc','#3b1f6b'], font:null,           css:{ '--background':'270 50% 6%','--foreground':'270 20% 95%','--card':'270 48% 9%','--primary':'271 76% 68%','--primary-foreground':'270 50% 6%','--border':'270 24% 20%','--muted':'270 24% 13%','--muted-foreground':'270 15% 58%' } },
  { id:'bubblegum',   name:'Bubblegum',  emoji:'🍬', type:'light', preview:['#fef0f7','#f9a8d4','#e879f9'], font:'Nunito',       css:{ '--background':'330 100% 97%','--foreground':'330 40% 18%','--primary':'330 80% 58%','--primary-foreground':'0 0% 100%','--border':'330 40% 84%','--muted':'330 30% 92%','--muted-foreground':'330 20% 45%' }, isNew:true },
  { id:'sketchy',     name:'Sketchy',    emoji:'✏️', type:'light', preview:['#fffdf5','#fde68a','#78716c'], font:'Caveat',       css:{ '--background':'48 100% 98%','--foreground':'30 40% 15%','--primary':'25 95% 53%','--primary-foreground':'0 0% 100%','--border':'30 30% 70%','--muted':'48 40% 90%','--muted-foreground':'30 20% 45%' }, isNew:true },
  { id:'cartoon',     name:'Cartoon',    emoji:'🎨', type:'light', preview:['#f0f4ff','#818cf8','#fbbf24'], font:'Baloo 2',      css:{ '--background':'230 100% 97%','--foreground':'230 50% 12%','--primary':'230 85% 60%','--primary-foreground':'0 0% 100%','--border':'230 40% 78%','--muted':'230 30% 92%','--muted-foreground':'230 20% 45%' }, isNew:true },
  { id:'cottagecore', name:'Cottage',    emoji:'🍄', type:'light', preview:['#fdf6ec','#d4a574','#8fbc8f'], font:'Lora',         css:{ '--background':'35 60% 96%','--foreground':'25 40% 18%','--primary':'25 60% 44%','--primary-foreground':'0 0% 100%','--border':'35 30% 76%','--muted':'35 25% 88%','--muted-foreground':'25 20% 45%' }, isNew:true },
  { id:'retrowave',   name:'Retrowave',  emoji:'🕹️', type:'dark',  preview:['#0a0015','#ff2d78','#00f0ff'], font:'Orbitron',     css:{ '--background':'280 100% 4%','--foreground':'300 80% 90%','--card':'280 80% 7%','--primary':'330 100% 58%','--primary-foreground':'0 0% 100%','--border':'290 50% 20%','--muted':'270 40% 10%','--muted-foreground':'300 30% 60%' }, isNew:true },
  { id:'gamerboy',    name:'Gamer Boy',  emoji:'🎮', type:'dark',  preview:['#0d1117','#00ff88','#21262d'], font:'Orbitron',     css:{ '--background':'215 28% 7%','--foreground':'210 20% 85%','--card':'215 28% 10%','--primary':'150 100% 50%','--primary-foreground':'215 28% 7%','--border':'215 28% 18%','--muted':'215 28% 13%','--muted-foreground':'215 15% 55%' }, isNew:true, isBoy:true },
  { id:'animegirl',   name:'Anime Girl', emoji:'🌸✨', type:'light', preview:['#fff0f8','#f9a8d4','#a855f7'], font:'Fredoka One',  css:{ '--background':'330 100% 97%','--foreground':'330 50% 28%','--primary':'330 65% 50%','--primary-foreground':'0 0% 100%','--border':'330 60% 85%','--muted':'330 50% 93%','--muted-foreground':'330 30% 55%' }, isNew:true, isGirl:true },
];

// ─────────────────────────────────────────────────────────────────────────────
// APPLY THEME
// ─────────────────────────────────────────────────────────────────────────────
function applyTheme(themeId) {
  injectMasterStyles();
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root  = document.documentElement;

  // 1. Remove ALL previous CSS variable overrides from all themes
  THEMES.forEach(t => Object.keys(t.css).forEach(k => root.style.removeProperty(k)));

  // 2. Apply new theme's CSS variables
  Object.entries(theme.css).forEach(([k, v]) => root.style.setProperty(k, v));

  // 3. Set data-theme attribute (drives the master stylesheet rules)
  root.setAttribute('data-theme', themeId);

  // 4. Toggle dark class for Tailwind dark: variants
  theme.type === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');

  // 5. Persist
  localStorage.setItem('soul-theme', themeId);
}

// Restore on import
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
  "Your words matter. Keep writing. 💌","Every entry is a little treasure. 🪄",
  "You're doing better than you think. 🌟","This is your safe space. 🫶",
  "Small moments deserve to be remembered. ✨","You're the author of your own story. 📖",
  "Feelings felt are feelings healed. 🌸","Today is worth writing about. 🌈",
  "Your emotions are valid, all of them. 💙","Showing up for yourself is brave. 🦋",
];
const MOOD_OPTIONS = [
  {emoji:'😄',label:'Great'},{emoji:'😊',label:'Good'},{emoji:'😌',label:'Calm'},
  {emoji:'😐',label:'Okay'},{emoji:'😔',label:'Low'},{emoji:'😢',label:'Sad'},
  {emoji:'😤',label:'Frustrated'},{emoji:'😰',label:'Anxious'},
  {emoji:'🥰',label:'Loved'},{emoji:'😴',label:'Tired'},
];
const NOTIFICATION_OPTIONS = [
  { id:'daily_reminder', label:'Daily journal reminder', desc:'Gentle nudge each day',        icon:Bell  },
  { id:'weekly_report',  label:'Weekly emotional report', desc:'Mood summary every Sunday',  icon:Star  },
  { id:'motivation',     label:'Morning motivation',      desc:'Personalized from Soul',      icon:Zap   },
  { id:'milestone',      label:'Milestone celebrations',  desc:'Celebrate streaks & goals',  icon:Heart },
];
const PRIVACY_OPTIONS = [
  { id:'private_mode', label:'Private mode',          desc:'Blur content when screen sharing' },
  { id:'auto_lock',    label:'Auto-lock after 5 min', desc:'Require re-auth after inactivity' },
  { id:'hide_streak',  label:'Hide streak publicly',  desc:'Only you see your streak count'   },
];
const EXPORT_FORMATS = [
  { id:'pdf',      label:'PDF Journal', icon:'📄', desc:'Formatted PDF'  },
  { id:'json',     label:'JSON Data',   icon:'📦', desc:'Raw data export' },
  { id:'markdown', label:'Markdown',    icon:'📝', desc:'Plain text'      },
];
const TABS = [
  {id:'profile',label:'Profile',icon:'👤'},
  {id:'theme',label:'Theme',icon:'🎨'},
  {id:'notifications',label:'Alerts',icon:'🔔'},
  {id:'privacy',label:'Privacy',icon:'🔒'},
  {id:'data',label:'Data',icon:'📦'},
];

// ─────────────────────────────────────────────────────────────────────────────
// DOODLE DECORATIONS
// ─────────────────────────────────────────────────────────────────────────────
function ThemeDoodle({ themeId }) {
  const s = { position:'absolute', top:8, right:10, opacity:0.2, pointerEvents:'none', zIndex:0 };

  if (themeId === 'bubblegum') return (
    <svg width="110" height="65" viewBox="0 0 110 65" style={s}>
      <circle cx="18" cy="18" r="12" fill="#f9a8d4"/>
      <circle cx="46" cy="10" r="8"  fill="#c084fc"/>
      <circle cx="74" cy="16" r="10" fill="#fde68a"/>
      <circle cx="98" cy="9"  r="6"  fill="#86efac"/>
      <path d="M14 18 Q18 10 22 18" stroke="#ec4899" strokeWidth="1.5" fill="none"/>
      <circle cx="46" cy="10" r="2" fill="#a855f7"/>
      <circle cx="18" cy="18" r="2" fill="#ec4899"/>
    </svg>
  );
  if (themeId === 'sketchy') return (
    <svg width="120" height="65" viewBox="0 0 120 65" style={s}>
      <path d="M8 55 Q28 8 58 38 Q88 68 108 18" stroke="#292524" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="22" cy="28" r="9" stroke="#292524" strokeWidth="1.5" fill="none"/>
      <path d="M65 50 L75 40 L85 50 L75 60Z" stroke="#292524" strokeWidth="1.5" fill="none"/>
      <path d="M98 55 Q103 47 110 55 Q103 63 98 55Z" stroke="#292524" strokeWidth="1.5" fill="none"/>
    </svg>
  );
  if (themeId === 'cartoon') return (
    <svg width="115" height="70" viewBox="0 0 115 70" style={s}>
      <circle cx="57" cy="30" r="22" fill="#fde68a" stroke="#1e1b4b" strokeWidth="2.5"/>
      <circle cx="50" cy="26" r="4"  fill="#1e1b4b"/>
      <circle cx="64" cy="26" r="4"  fill="#1e1b4b"/>
      <circle cx="51" cy="25" r="1.5" fill="white"/>
      <circle cx="65" cy="25" r="1.5" fill="white"/>
      <path d="M50 37 Q57 45 64 37" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="3" y="18" width="26" height="20" rx="8" fill="#818cf8" stroke="#1e1b4b" strokeWidth="2"/>
      <polygon points="90,8 104,30 76,30" fill="#f472b6" stroke="#1e1b4b" strokeWidth="2"/>
    </svg>
  );
  if (themeId === 'cottagecore') return (
    <svg width="110" height="68" viewBox="0 0 110 68" style={s}>
      <path d="M10 65 Q18 40 32 46 Q36 28 50 34 Q54 16 66 22 Q76 12 86 26 Q94 22 96 42 Q108 40 106 65Z" fill="#8fbc8f"/>
      <circle cx="40" cy="54" r="5.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="62" cy="46" r="4.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="80" cy="52" r="3.5" fill="#ef4444" opacity="0.8"/>
      <rect x="28" y="52" width="12" height="13" rx="6" fill="#d4a574"/>
    </svg>
  );
  if (themeId === 'retrowave') return (
    <svg width="120" height="68" viewBox="0 0 120 68" style={s}>
      <rect x="4" y="6" width="38" height="24" rx="3" fill="none" stroke="#ff2d78" strokeWidth="1.5"/>
      <rect x="7" y="9" width="32" height="18" rx="2" fill="#ff2d7818"/>
      <line x1="48" y1="14" x2="118" y2="14" stroke="#00f0ff" strokeWidth="1" opacity="0.6"/>
      <line x1="48" y1="20" x2="108" y2="20" stroke="#7c3aed" strokeWidth="1" opacity="0.5"/>
      <line x1="48" y1="26" x2="115" y2="26" stroke="#00f0ff" strokeWidth="1" opacity="0.4"/>
      <circle cx="20" cy="50" r="14" fill="none" stroke="#ff2d78" strokeWidth="1.5"/>
      <circle cx="20" cy="50" r="7"  fill="none" stroke="#7c3aed" strokeWidth="1"/>
      <circle cx="20" cy="50" r="3"  fill="#ff2d78"/>
      <rect x="46" y="40" width="68" height="7" rx="3.5" fill="none" stroke="#00f0ff" strokeWidth="1"/>
      <rect x="46" y="40" width="38" height="7" rx="3.5" fill="#00f0ff44"/>
    </svg>
  );
  if (themeId === 'gamerboy') return (
    <svg width="120" height="68" viewBox="0 0 120 68" style={{...s, opacity:0.25}}>
      {/* gamepad */}
      <rect x="25" y="15" width="70" height="42" rx="20" fill="none" stroke="#00ff88" strokeWidth="1.5"/>
      <circle cx="80" cy="28" r="5" fill="#00ff88" opacity="0.7"/>
      <circle cx="91" cy="37" r="5" fill="#00ff88" opacity="0.4"/>
      <circle cx="69" cy="37" r="5" fill="#00ff88" opacity="0.4"/>
      <circle cx="80" cy="46" r="5" fill="#00ff88" opacity="0.4"/>
      <line x1="40" y1="30" x2="40" y2="44" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="33" y1="37" x2="47" y2="37" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="55" y="35" width="10" height="4" rx="2" fill="#00ff88" opacity="0.5"/>
    </svg>
  );
  if (themeId === 'animegirl') return (
    <svg width="115" height="70" viewBox="0 0 115 70" style={{...s, opacity:0.25}}>
      {/* cute anime face */}
      <circle cx="57" cy="32" r="24" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2"/>
      <circle cx="49" cy="28" r="5"  fill="#1e1b4b"/>
      <circle cx="65" cy="28" r="5"  fill="#1e1b4b"/>
      <circle cx="50" cy="27" r="2"  fill="white"/>
      <circle cx="66" cy="27" r="2"  fill="white"/>
      <path d="M50 40 Q57 48 64 40" stroke="#f472b6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* cat ears */}
      <polygon points="40,12 33,0 50,10" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.5"/>
      <polygon points="74,12 81,0 64,10" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.5"/>
      {/* sparkles */}
      <text x="3"  y="20" fontSize="12" fill="#f472b6">✦</text>
      <text x="95" y="15" fontSize="10" fill="#a855f7">✦</text>
      <text x="95" y="55" fontSize="8"  fill="#f9a8d4">✦</text>
    </svg>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
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

function Card({ children, style = {}, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}
         style={{ backgroundColor:'var(--card-bg, white)', ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
      {Icon && <Icon style={{ width:16, height:16, color:'var(--muted-foreground,#6b7280)' }}/>}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{children}</h2>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999, backdropFilter:'blur(6px)',
    }}>
      <motion.div initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-card border border-border rounded-2xl"
        style={{ padding:32, maxWidth:400, width:'90%', position:'relative', textAlign:'center' }}>
        <button onClick={onCancel} style={{
          position:'absolute', top:14, right:14, background:'transparent',
          border:'none', cursor:'pointer',
        }}><X size={18}/></button>
        <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
        <h3 className="text-lg font-semibold text-foreground" style={{ marginBottom:8 }}>Delete all data?</h3>
        <p className="text-sm text-muted-foreground" style={{ lineHeight:1.65, marginBottom:24 }}>
          Permanently deletes all journal entries, memories, and settings.
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

  // Ensure master styles are injected on mount
  useEffect(() => { injectMasterStyles(); }, []);

  useEffect(() => {
    journalApi.getAll({ limit:200 })
      .then(res => {
        const entries = res.data || [];
        setEntryCount(entries.length);
        const dates = [...new Set(entries.map(e => new Date(e.created_at || e.date || Date.now()).toDateString()))];
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
      if (r?.secure_url) { setProfile(p => ({ ...p, avatar_url:r.secure_url })); toast.success('Photo updated!'); }
      else toast.error('Upload failed');
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('soul-profile',       JSON.stringify(profile));
    localStorage.setItem('soul-notifications', JSON.stringify(notifications));
    localStorage.setItem('soul-privacy',       JSON.stringify(privacy));
    setTimeout(() => {
      setSaving(false); setSavedAnim(true);
      toast.success('All settings saved! 🎉');
      setTimeout(() => setSavedAnim(false), 2200);
    }, 500);
  };

  const handleTheme = (id) => {
    setActiveTheme(id);
    applyTheme(id);
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

  const themeObj    = THEMES.find(t => t.id === activeTheme) || THEMES[0];
  const displayName = profile.nickname || profile.username || 'Friend';
  const initials    = displayName.slice(0, 2).toUpperCase();

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* Greeting */}
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-semibold text-foreground mt-0.5">Your Profile</h1>
          </motion.div>

          {/* ── Hero card ── */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}>
            <div className="bg-card border border-border rounded-2xl p-6"
                 style={{ position:'relative', overflow:'hidden' }}>
              <ThemeDoodle themeId={activeTheme}/>

              {/* Avatar + info */}
              <div style={{ display:'flex', alignItems:'center', gap:20, position:'relative', zIndex:1 }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <motion.div whileHover={{ scale:1.04 }}
                    style={{
                      width:80, height:80, borderRadius:'50%', overflow:'hidden',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', border:'3px solid var(--primary,#ec4899)',
                      background:'var(--muted,#f3f4f6)',
                    }}
                    onClick={() => fileRef.current?.click()}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span style={{ fontSize:24, fontWeight:700, color:'var(--primary,#ec4899)' }}>{initials}</span>
                    }
                  </motion.div>
                  <motion.button whileHover={{ scale:1.15 }} whileTap={{ scale:0.95 }}
                    onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{
                      position:'absolute', bottom:-4, right:-4, width:28, height:28,
                      borderRadius:'50%', background:'var(--primary,#ec4899)', color:'white',
                      border:'none', cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                    {uploading ? <Loader2 style={{ width:14, height:14 }} className="animate-spin"/> : <Camera style={{ width:14, height:14 }}/>}
                  </motion.button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarUpload}/>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <p className="font-semibold text-foreground" style={{ fontSize:18, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {displayName}
                  </p>
                  {profile.bio && (
                    <p className="text-muted-foreground" style={{ fontSize:13, marginTop:2, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {profile.bio}
                    </p>
                  )}
                  {profile.quote && (
                    <p className="text-muted-foreground" style={{ fontSize:12, marginTop:4, fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      "{profile.quote}"
                    </p>
                  )}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                    {[
                      { label:`${entryCount === null ? '…' : entryCount} entries`, icon:<BookHeart style={{ width:12, height:12 }}/> },
                      { label:themeObj.name,   icon:<span style={{ fontSize:12 }}>{themeObj.emoji}</span> },
                      ...(streakDays > 0 ? [{ label:`${streakDays}-day streak`, icon:'🔥', orange:true }] : []),
                    ].map(({ label, icon, orange }) => (
                      <span key={label} style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:12, fontWeight:500, padding:'4px 10px', borderRadius:50,
                        background: orange ? 'rgba(234,88,12,0.12)' : 'var(--primary,#ec4899)15',
                        color: orange ? '#ea580c' : 'var(--primary,#ec4899)',
                      }}>
                        {icon} {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mood check-in */}
              <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border,#e5e7eb)', position:'relative', zIndex:1 }}>
                <p className="text-muted-foreground" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
                  How are you feeling right now?
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {MOOD_OPTIONS.map((m, i) => (
                    <motion.button key={i} whileHover={{ scale:1.18 }} whileTap={{ scale:0.9 }}
                      onClick={() => handleMood(i)} title={m.label}
                      style={{
                        width:40, height:40, borderRadius:'50%', border:'2.5px solid',
                        borderColor: currentMood === i ? 'var(--primary,#ec4899)' : 'transparent',
                        background: currentMood === i ? 'var(--primary,#ec4899)18' : 'var(--muted,#f3f4f6)',
                        cursor:'pointer', fontSize:20, transition:'all 0.15s',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
                {currentMood !== null && (
                  <p className="text-muted-foreground" style={{ fontSize:12, marginTop:6 }}>
                    Feeling <strong className="text-foreground">{MOOD_OPTIONS[currentMood].label}</strong> right now
                  </p>
                )}
              </div>

              {/* Affirmation */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border,#e5e7eb)', position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', gap:6 }}>
                <Sparkles style={{ width:14, height:14, color:'var(--primary,#ec4899)', flexShrink:0, marginTop:2 }}/>
                <p className="text-muted-foreground" style={{ fontSize:13, fontStyle:'italic', lineHeight:1.5 }}>
                  {affirmation}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Tabs ── */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.13 }}>
            <div className="bg-muted" style={{ display:'flex', gap:4, borderRadius:14, padding:4, overflowX:'auto' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:6, padding:'8px 12px',
                    borderRadius:10, fontSize:13, fontWeight:500, transition:'all 0.18s',
                    whiteSpace:'nowrap', flex:1, justifyContent:'center', border:'none', cursor:'pointer',
                    background: activeTab === tab.id ? 'var(--background,white)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--foreground,#111)' : 'var(--muted-foreground,#6b7280)',
                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Tab panels ── */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.2 }}>

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <SectionLabel>About you</SectionLabel>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Username</Label>
                        <Input placeholder="your_username" value={profile.username || ''}
                          onChange={e => setProfile(p => ({ ...p, username:e.target.value }))}
                          className="bg-background border-input"/>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>
                          Nickname <span className="text-muted-foreground" style={{ fontSize:11, fontWeight:400 }}>(greetings)</span>
                        </Label>
                        <Input placeholder="What should we call you?" value={profile.nickname || ''}
                          onChange={e => setProfile(p => ({ ...p, nickname:e.target.value }))}
                          className="bg-background border-input"/>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Bio</Label>
                      <Input placeholder="A little something about you…" value={profile.bio || ''}
                        onChange={e => setProfile(p => ({ ...p, bio:e.target.value }))}
                        className="bg-background border-input"/>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Favourite quote</Label>
                      <Input placeholder="A line that keeps you going…" value={profile.quote || ''}
                        onChange={e => setProfile(p => ({ ...p, quote:e.target.value }))}
                        className="bg-background border-input"/>
                    </div>
                    {profile.quote && (
                      <div style={{
                        padding:'10px 14px', borderRadius:10,
                        background:'var(--primary,#ec4899)08',
                        border:'1px solid var(--primary,#ec4899)20',
                        fontStyle:'italic', fontSize:13,
                        color:'var(--muted-foreground,#6b7280)',
                      }}>
                        "{profile.quote}"
                      </div>
                    )}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Timezone</Label>
                        <select value={profile.timezone || 'UTC'}
                          onChange={e => setProfile(p => ({ ...p, timezone:e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                          {['UTC','Asia/Kolkata','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Journal goal</Label>
                        <select value={profile.goal || 'daily'}
                          onChange={e => setProfile(p => ({ ...p, goal:e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                          <option value="daily">Every day</option>
                          <option value="weekdays">Weekdays only</option>
                          <option value="3x">3× per week</option>
                          <option value="weekly">Once a week</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* THEME */}
              {activeTab === 'theme' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <SectionLabel icon={Palette}>App Theme</SectionLabel>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {THEMES.map(theme => (
                      <motion.button key={theme.id}
                        whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.97 }}
                        onClick={() => handleTheme(theme.id)}
                        style={{
                          position:'relative', display:'flex', alignItems:'center', gap:12,
                          padding:'12px', borderRadius:12, textAlign:'left', cursor:'pointer',
                          border: activeTheme === theme.id ? '2px solid var(--primary,#ec4899)' : '1.5px solid var(--border,#e5e7eb)',
                          background: activeTheme === theme.id ? 'var(--primary,#ec4899)08' : 'var(--background,white)',
                          transition:'all 0.18s',
                        }}>
                        {/* swatches */}
                        <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
                          {theme.preview.map((c, i) => (
                            <div key={i} style={{ width:13, height:13, borderRadius:3, backgroundColor:c, border:'1px solid rgba(0,0,0,0.1)' }}/>
                          ))}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                            <span style={{ fontSize:15 }}>{theme.emoji}</span>
                            <span className="text-foreground" style={{ fontWeight:500, fontSize:13 }}>{theme.name}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }} className="text-muted-foreground">
                            {theme.type === 'dark'
                              ? <Moon style={{ width:10, height:10 }}/>
                              : <Sun style={{ width:10, height:10 }}/>}
                            <span style={{ fontSize:11 }}>{theme.type}</span>
                            {theme.font && <span style={{ fontSize:11, marginLeft:4, opacity:0.55 }}>· {theme.font}</span>}
                            {theme.isBoy  && <Gamepad2 style={{ width:10, height:10, marginLeft:4, color:'#00ff88' }}/>}
                            {theme.isGirl && <Music    style={{ width:10, height:10, marginLeft:4, color:'#f472b6' }}/>}
                          </div>
                        </div>
                        {activeTheme === theme.id && (
                          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                            style={{
                              width:20, height:20, borderRadius:'50%', flexShrink:0,
                              background:'var(--primary,#ec4899)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                            <Check style={{ width:12, height:12, color:'white' }}/>
                          </motion.div>
                        )}
                        {theme.isNew && (
                          <div style={{
                            position:'absolute', top:-7, right:8,
                            fontSize:9, fontWeight:700,
                            background:'var(--primary,#ec4899)', color:'white',
                            padding:'2px 7px', borderRadius:4, letterSpacing:'0.06em', textTransform:'uppercase',
                          }}>NEW</div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border,#e5e7eb)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span className="text-muted-foreground" style={{ fontSize:13 }}>Active theme</span>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
                      borderRadius:50, fontSize:13, fontWeight:500,
                      background:'var(--primary,#ec4899)12', color:'var(--primary,#ec4899)',
                    }}>
                      {themeObj.emoji} {themeObj.name}
                      {themeObj.font && <span style={{ fontSize:11, opacity:0.6 }}>· {themeObj.font}</span>}
                    </span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize:12, textAlign:'center', marginTop:12 }}>
                    Themes apply instantly across the whole app
                  </p>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <SectionLabel icon={Bell}>Notifications</SectionLabel>
                  <div>
                    {NOTIFICATION_OPTIONS.map(({ id, label, desc, icon:Icon }) => (
                      <div key={id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border,#e5e7eb)' }}
                        className="last:border-0">
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{
                            width:32, height:32, borderRadius:8, flexShrink:0,
                            background:'var(--primary,#ec4899)12',
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>
                            <Icon style={{ width:16, height:16, color:'var(--primary,#ec4899)' }}/>
                          </div>
                          <div>
                            <p className="text-foreground" style={{ fontSize:13, fontWeight:500 }}>{label}</p>
                            <p className="text-muted-foreground" style={{ fontSize:12 }}>{desc}</p>
                          </div>
                        </div>
                        <Toggle checked={!!notifications[id]} onChange={v => setNotifications(p => ({ ...p, [id]:v }))}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--border,#e5e7eb)' }}>
                    <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Daily reminder time</Label>
                    <Input type="time" value={profile.reminderTime || '09:00'}
                      onChange={e => setProfile(p => ({ ...p, reminderTime:e.target.value }))}
                      className="bg-background border-input" style={{ width:150 }}/>
                    <p className="text-muted-foreground" style={{ fontSize:12, marginTop:6 }}>Your journal nudge fires at this time</p>
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {activeTab === 'privacy' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <SectionLabel icon={Shield}>Privacy & Security</SectionLabel>
                  <div style={{ marginBottom:20 }}>
                    {PRIVACY_OPTIONS.map(({ id, label, desc }) => (
                      <div key={id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border,#e5e7eb)' }}
                        className="last:border-0">
                        <div>
                          <p className="text-foreground" style={{ fontSize:13, fontWeight:500 }}>{label}</p>
                          <p className="text-muted-foreground" style={{ fontSize:12 }}>{desc}</p>
                        </div>
                        <Toggle checked={!!privacy[id]} onChange={v => setPrivacy(p => ({ ...p, [id]:v }))}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ paddingTop:16, borderTop:'1px solid var(--border,#e5e7eb)' }}>
                    <Label className="text-sm font-medium text-foreground" style={{ marginBottom:6, display:'block' }}>Change password</Label>
                    <Input type="password" placeholder="Enter new password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-background border-input" style={{ maxWidth:280 }}/>
                    <Button variant="outline" size="sm" style={{ marginTop:8 }}
                      onClick={() => { toast.success('Password update sent'); setNewPassword(''); }}>
                      Update password
                    </Button>
                  </div>
                </div>
              )}

              {/* DATA */}
              {activeTab === 'data' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <SectionLabel icon={Download}>Export Your Data</SectionLabel>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                      {EXPORT_FORMATS.map(({ id, label, icon, desc }) => (
                        <motion.button key={id} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                          onClick={() => handleExport(id)}
                          style={{
                            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                            padding:16, borderRadius:12, textAlign:'center', cursor:'pointer',
                            border:'1.5px solid var(--border,#e5e7eb)', background:'var(--background,white)',
                            transition:'all 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary,#ec4899)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border,#e5e7eb)'}>
                          <span style={{ fontSize:26 }}>{icon}</span>
                          <div>
                            <p className="text-foreground" style={{ fontSize:13, fontWeight:500 }}>{label}</p>
                            <p className="text-muted-foreground" style={{ fontSize:11 }}>{desc}</p>
                          </div>
                          {exporting === id
                            ? <Loader2 style={{ width:16, height:16, color:'var(--primary,#ec4899)' }} className="animate-spin"/>
                            : <ChevronRight style={{ width:16, height:16, color:'var(--muted-foreground,#6b7280)' }}/>
                          }
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border rounded-2xl p-6" style={{ borderColor:'rgba(239,68,68,0.3)' }}>
                    <SectionLabel icon={Trash2}><span style={{ color:'#ef4444' }}>Danger Zone</span></SectionLabel>
                    <p className="text-muted-foreground" style={{ fontSize:13, lineHeight:1.6, marginBottom:16 }}>
                      Permanently delete all journal entries, memories, and settings.
                      <strong className="text-foreground"> This cannot be undone.</strong>
                    </p>
                    <Button onClick={() => setShowDelete(true)}
                      style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 style={{ width:16, height:16, marginRight:8 }}/>
                      Delete all my data
                    </Button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Save button */}
          {activeTab !== 'data' && (
            <motion.div whileTap={{ scale:0.98 }}>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {savedAnim
                    ? <motion.span key="ok"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Check style={{ width:16, height:16 }}/> Saved!
                      </motion.span>
                    : <motion.span key="sv"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {saving ? <Loader2 style={{ width:16, height:16 }} className="animate-spin"/> : <Save style={{ width:16, height:16 }}/>}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </motion.span>
                  }
                </AnimatePresence>
              </Button>
            </motion.div>
          )}

          <div style={{ height:32 }}/>
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