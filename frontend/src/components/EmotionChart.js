import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const EMOTION_VALUES = {
  joy: 5,
  calm: 4,
  neutral: 3,
  anxiety: 2,
  sadness: 1,
  anger: 0
};

const EMOTION_COLORS = {
  joy: '#F6E0B5',
  calm: '#D4E2D4',
  neutral: '#E2E8F0',
  anxiety: '#E2D4F0',
  sadness: '#8EACCD',
  anger: '#E8B4B8'
};

export default function EmotionChart({ data }) {
  // Transform data for chart
  const chartData = data.map(item => ({
    date: item.date,
    emotion: item.emotion,
    value: EMOTION_VALUES[item.emotion] || 3,
    color: EMOTION_COLORS[item.emotion] || EMOTION_COLORS.neutral
  }));

  // Fill in missing days
  const filledData = [];
  if (chartData.length > 0) {
    const startDate = new Date(chartData[0].date);
    const endDate = new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = chartData.find(item => item.date === dateStr);
      filledData.push(existing || {
        date: dateStr,
        emotion: 'neutral',
        value: 3,
        color: EMOTION_COLORS.neutral
      });
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const emotion = payload[0].payload.emotion;
      return (
        <div className="bg-white rounded-xl p-3 shadow-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            {new Date(label).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-sm font-medium capitalize">{emotion}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="soul-card" data-testid="emotion-chart">
      <h3 className="text-lg font-medium text-foreground mb-4" style={{ fontFamily: 'Manrope' }}>
        Weekly Emotional Trend
      </h3>
      
      {filledData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Start tracking to see your emotional trend
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filledData.slice(-7)}>
              <defs>
                <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, 5]}
                hide
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#emotionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {Object.entries(EMOTION_COLORS).slice(0, 4).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center gap-1">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground capitalize">{emotion}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
