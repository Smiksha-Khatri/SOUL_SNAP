import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EMOTIONS = [
  { value: 'joy', label: 'Joy', color: 'bg-[hsl(43,75%,85%)]', emoji: '😊' },
  { value: 'calm', label: 'Calm', color: 'bg-[hsl(120,24%,85%)]', emoji: '😌' },
  { value: 'neutral', label: 'Neutral', color: 'bg-muted', emoji: '😐' },
  { value: 'anxiety', label: 'Anxious', color: 'bg-[hsl(270,40%,90%)]', emoji: '😰' },
  { value: 'sadness', label: 'Sad', color: 'bg-[hsl(209,40%,68%)]', emoji: '😢' },
  { value: 'anger', label: 'Angry', color: 'bg-[hsl(0,50%,90%)]', emoji: '😤' },
];

export default function QuickMoodWidget({ onMoodLogged }) {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [encouragement, setEncouragement] = useState(null);

  const handleSubmit = async () => {
    if (!selectedEmotion) return;

    setLoading(true);
    try {
      const response = await dashboardApi.quickMood(selectedEmotion, note || null);
      setEncouragement(response.data.encouragement);
      toast.success('Mood logged!');
      setSelectedEmotion(null);
      setNote('');
      onMoodLogged?.();
      
      // Clear encouragement after 5 seconds
      setTimeout(() => setEncouragement(null), 5000);
    } catch (error) {
      toast.error('Failed to log mood');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soul-card" data-testid="quick-mood-widget">
      <h3 className="text-lg font-medium text-foreground mb-4" style={{ fontFamily: 'Manrope' }}>
        How are you feeling right now?
      </h3>

      {encouragement ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/30 rounded-2xl p-4 text-center"
        >
          <p className="text-sm text-foreground">{encouragement}</p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => setSelectedEmotion(emotion.value)}
                className={`p-3 rounded-2xl transition-all duration-200 flex flex-col items-center gap-1 ${
                  selectedEmotion === emotion.value
                    ? `${emotion.color} ring-2 ring-primary ring-offset-2`
                    : `${emotion.color} hover:ring-2 hover:ring-primary/30`
                }`}
                data-testid={`mood-${emotion.value}`}
              >
                <span className="text-2xl">{emotion.emoji}</span>
                <span className="text-xs font-medium">{emotion.label}</span>
              </button>
            ))}
          </div>

          {selectedEmotion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a quick note (optional)..."
                className="resize-none rounded-xl h-20"
                data-testid="mood-note-input"
              />
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-full bg-primary hover:bg-primary/90"
                data-testid="log-mood-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Log Mood'
                )}
              </Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
