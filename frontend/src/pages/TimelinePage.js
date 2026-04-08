import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Loader2, 
  Calendar,
  Heart
} from 'lucide-react';

const EMOTION_COLORS = {
  joy: '#F6E0B5',
  calm: '#D4E2D4',
  sadness: '#8EACCD',
  anger: '#E8B4B8',
  anxiety: '#E2D4F0',
  neutral: '#E2E8F0'
};

export default function TimelinePage() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadTimeline();
  }, [days]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getTimeline(days);
      setTimeline(response.data.timeline || []);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-background" data-testid="timeline-page">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
                Emotional Timeline
              </h1>
              <p className="text-sm text-muted-foreground">Your journey through emotions over time</p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30, 60].map(d => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(d)}
                  className="rounded-full"
                >
                  {d}d
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-medium text-foreground mb-2" style={{ fontFamily: 'Manrope' }}>
                No Timeline Data Yet
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start journaling and chatting to build your emotional timeline.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Timeline Line */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                
                <AnimatePresence>
                  {timeline.map((day, index) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-16 pb-8"
                    >
                      {/* Timeline Node */}
                      <div 
                        className="absolute left-4 top-1 h-5 w-5 rounded-full border-4 border-background"
                        style={{ backgroundColor: EMOTION_COLORS[day.dominant_emotion] || EMOTION_COLORS.neutral }}
                      />

                      {/* Date Header */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">{formatDate(day.date)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Heart className="h-3 w-3" style={{ color: EMOTION_COLORS[day.dominant_emotion] }} />
                          Mostly {day.dominant_emotion}
                        </p>
                      </div>

                      {/* Entries */}
                      <div className="space-y-2">
                        {day.entries.slice(0, 3).map((entry, i) => (
                          <div 
                            key={entry.id || i}
                            className="soul-card !p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="h-2 w-2 rounded-full shrink-0 mt-2"
                                style={{ backgroundColor: EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.neutral }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground line-clamp-2">{entry.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground capitalize">{entry.source}</span>
                                  {entry.event_tag && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                      {entry.event_tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {day.entries.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-5">
                            +{day.entries.length - 3} more entries
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </ScrollArea>
      </main>
    </div>
  );
}
