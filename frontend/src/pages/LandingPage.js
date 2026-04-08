import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { 
  BookOpen, 
  MessageCircle, 
  Brain, 
  LineChart, 
  Sparkles,
  ChevronRight,
  Heart
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Emotional Journal',
    description: 'Write daily thoughts with automatic sentiment analysis'
  },
  {
    icon: MessageCircle,
    title: 'AI Companion',
    description: 'Chat with Soul, your supportive AI friend'
  },
  {
    icon: Brain,
    title: 'Memory Capsules',
    description: 'AI-generated summaries of your emotional journey'
  },
  {
    icon: LineChart,
    title: 'Weekly Reports',
    description: 'Analytics and insights about your emotional patterns'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <span className="font-semibold text-foreground" style={{ fontFamily: 'Manrope' }}>
              Soul Snap
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="rounded-full">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full bg-primary hover:bg-primary/90" data-testid="get-started-btn">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm text-foreground mb-6">
              <Heart className="h-4 w-4 text-primary" />
              Your emotional wellness companion
            </span>
            
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6 tracking-tight"
              style={{ fontFamily: 'Manrope' }}
            >
              A Web App That Remembers
              <br />
              <span className="text-primary">Your Emotions</span>, Not Just Data
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Soul Snap is your personal emotional diary and AI companion. Write daily thoughts, 
              chat with a supportive AI friend, and discover patterns in your emotional journey.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 h-14 px-8">
                  Start Your Journey
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.pexels.com/photos/30887567/pexels-photo-30887567.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Soul Snap Dashboard"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <p className="text-2xl font-medium mb-2" style={{ fontFamily: 'Manrope' }}>
                Track your emotional wellness
              </p>
              <p className="text-white/80">
                Beautiful insights and AI-powered analysis of your feelings
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-medium text-foreground mb-4"
              style={{ fontFamily: 'Manrope' }}
            >
              Everything you need for emotional wellness
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit to understand, track, and improve your emotional health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="soul-card flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: 'Manrope' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 
            className="text-3xl font-medium text-foreground mb-4"
            style={{ fontFamily: 'Manrope' }}
          >
            Ready to understand yourself better?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join Soul Snap and start your emotional wellness journey today.
          </p>
          <Link to="/register">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 h-14 px-8">
              Create Free Account
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </span>
            <span className="text-sm text-muted-foreground">
              Soul Snap © 2025
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your emotions matter.
          </p>
        </div>
      </footer>
    </div>
  );
}
