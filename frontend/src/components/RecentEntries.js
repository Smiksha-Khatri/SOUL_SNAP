import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Calendar, ChevronRight, BookOpen } from 'lucide-react';

const EMOTION_COLORS = {
  joy: 'bg-[hsl(43,75%,85%)]',
  calm: 'bg-[hsl(120,24%,85%)]',
  sadness: 'bg-[hsl(209,40%,68%)] text-white',
  anger: 'bg-[hsl(0,50%,90%)]',
  anxiety: 'bg-[hsl(270,40%,90%)]',
  neutral: 'bg-muted'
};

export default function RecentEntries({ entries }) {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="soul-card" data-testid="recent-entries">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
          Recent Journal Entries
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/journal')}
          className="text-primary"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No journal entries yet. Start writing!
          </p>
          <Button 
            onClick={() => navigate('/journal')}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            Write First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/journal')}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                EMOTION_COLORS[entry.sentiment?.primary_emotion] || EMOTION_COLORS.neutral
              }`}>
                <span className="text-sm font-medium">
                  {entry.sentiment?.primary_emotion?.[0]?.toUpperCase() || 'N'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.title || 'Untitled Entry'}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {entry.content}
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Calendar className="h-3 w-3" />
                {formatDate(entry.created_at)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
