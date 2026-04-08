import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { memoriesApi, dashboardApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Loader2, 
  Sparkles,
  FileText,
  TrendingUp,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const EMOTION_COLORS = {
  joy: '#F6E0B5',
  calm: '#D4E2D4',
  sadness: '#8EACCD',
  anger: '#E8B4B8',
  anxiety: '#E2D4F0',
  neutral: '#E2E8F0'
};

export default function InsightsPage() {
  const [capsules, setCapsules] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({ capsule: false, report: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [capsulesRes, reportsRes] = await Promise.all([
        memoriesApi.getCapsules(10),
        dashboardApi.getWeeklyReports(10)
      ]);
      setCapsules(capsulesRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCapsule = async () => {
    setGenerating(prev => ({ ...prev, capsule: true }));
    try {
      await memoriesApi.generateCapsule(7);
      toast.success('Memory capsule generated!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate capsule');
    } finally {
      setGenerating(prev => ({ ...prev, capsule: false }));
    }
  };

  const generateReport = async () => {
    setGenerating(prev => ({ ...prev, report: true }));
    try {
      await dashboardApi.generateWeeklyReport();
      toast.success('Weekly report generated!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setGenerating(prev => ({ ...prev, report: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
    <div className="flex h-screen bg-background" data-testid="insights-page">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6 bg-white">
          <h1 className="text-2xl font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
            Insights & Reports
          </h1>
          <p className="text-sm text-muted-foreground">Memory capsules and emotional analytics</p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="capsules" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-full">
                <TabsTrigger value="capsules" className="rounded-full data-[state=active]:bg-white">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Memory Capsules
                </TabsTrigger>
                <TabsTrigger value="reports" className="rounded-full data-[state=active]:bg-white">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Weekly Reports
                </TabsTrigger>
              </TabsList>

              {/* Memory Capsules Tab */}
              <TabsContent value="capsules" className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    AI-generated summaries of your emotional memories
                  </p>
                  <Button
                    onClick={generateCapsule}
                    disabled={generating.capsule}
                    className="rounded-full bg-primary hover:bg-primary/90"
                    data-testid="generate-capsule-button"
                  >
                    {generating.capsule ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Capsule
                  </Button>
                </div>

                {capsules.length === 0 ? (
                  <div className="text-center py-12 soul-card">
                    <img 
                      src="https://images.pexels.com/photos/7605372/pexels-photo-7605372.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                      alt="Memory capsule"
                      className="w-48 h-48 object-cover rounded-3xl mx-auto mb-4 opacity-80"
                    />
                    <h3 className="text-lg font-medium text-foreground mb-2" style={{ fontFamily: 'Manrope' }}>
                      No Memory Capsules Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Create at least a few journal entries or chat conversations, then generate your first memory capsule.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {capsules.map((capsule, index) => (
                      <motion.div
                        key={capsule.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="soul-card"
                      >
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: EMOTION_COLORS[capsule.dominant_emotion] || EMOTION_COLORS.neutral }}
                          >
                            <Sparkles className="h-6 w-6 text-foreground/70" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: 'Manrope' }}>
                              {capsule.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {formatDate(capsule.period_start)} - {formatDate(capsule.period_end)}
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {capsule.summary}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                              <span 
                                className="text-xs px-3 py-1 rounded-full capitalize"
                                style={{ backgroundColor: EMOTION_COLORS[capsule.dominant_emotion] || EMOTION_COLORS.neutral }}
                              >
                                {capsule.dominant_emotion}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </TabsContent>

              {/* Weekly Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Weekly emotional analytics and recommendations
                  </p>
                  <Button
                    onClick={generateReport}
                    disabled={generating.report}
                    className="rounded-full bg-primary hover:bg-primary/90"
                    data-testid="generate-report-button"
                  >
                    {generating.report ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12 soul-card">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2" style={{ fontFamily: 'Manrope' }}>
                      No Weekly Reports Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Track your emotions for a week, then generate your first emotional report card.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {reports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="soul-card"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>
                              Weekly Report Card
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.week_start)} - {formatDate(report.week_end)}
                            </p>
                          </div>
                        </div>

                        {/* Emotion Breakdown Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-sm font-medium text-foreground mb-2">Emotion Breakdown</p>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(report.emotion_breakdown).map(([emotion, value]) => ({
                                      name: emotion,
                                      value: Math.round(value * 100)
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {Object.entries(report.emotion_breakdown).map(([emotion]) => (
                                      <Cell 
                                        key={emotion} 
                                        fill={EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral}
                                        stroke="none"
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{ 
                                      borderRadius: '12px', 
                                      border: 'none',
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {Object.entries(report.emotion_breakdown).map(([emotion, value]) => (
                                <span 
                                  key={emotion}
                                  className="text-xs px-2 py-1 rounded-full capitalize"
                                  style={{ backgroundColor: EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral }}
                                >
                                  {emotion}: {Math.round(value * 100)}%
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-foreground mb-2">Daily Emotions</p>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.daily_emotions}>
                                  <defs>
                                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10 }}
                                  />
                                  <YAxis hide />
                                  <Tooltip 
                                    contentStyle={{ 
                                      borderRadius: '12px', 
                                      border: 'none',
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="entry_count"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorEntries)"
                                    name="Entries"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-secondary/30 rounded-2xl p-4 mb-4">
                          <p className="text-sm text-foreground">{report.summary}</p>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Recommendations</p>
                          <ul className="space-y-2">
                            {report.recommendations.map((rec, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
