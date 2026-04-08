import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, journalApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import QuickMoodWidget from '../components/QuickMoodWidget';
import EmotionChart from '../components/EmotionChart';
import RecentEntries from '../components/RecentEntries';
import { Loader2, Sparkles, BookOpen, Brain, Heart } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" data-testid="dashboard-page">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          {/* Header with greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-8"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary) / 0.3) 100%)'
            }}
          >
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-3xl sm:text-4xl font-medium text-foreground mb-4" style={{ fontFamily: 'Manrope' }}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}
              </h1>
              {stats?.motivational_message && (
                <p className="text-muted-foreground max-w-xl flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  {stats.motivational_message}
                </p>
              )}
            </div>
            <img 
              src="https://images.pexels.com/photos/30887567/pexels-photo-30887567.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt=""
              className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-30 rounded-r-3xl"
            />
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="soul-card flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats?.total_entries || 0}</p>
                <p className="text-sm text-muted-foreground">Journal Entries</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="soul-card flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Brain className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats?.total_memories || 0}</p>
                <p className="text-sm text-muted-foreground">Memories Stored</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="soul-card flex items-center gap-4"
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center emotion-${stats?.dominant_emotion || 'neutral'}`}>
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground capitalize">{stats?.dominant_emotion || 'Neutral'}</p>
                <p className="text-sm text-muted-foreground">Dominant Mood</p>
              </div>
            </motion.div>
          </div>

          {/* Quick Mood + Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <QuickMoodWidget onMoodLogged={loadDashboardData} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <EmotionChart data={stats?.weekly_trend || []} />
            </motion.div>
          </div>

          {/* Recent Entries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <RecentEntries entries={stats?.recent_entries || []} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
