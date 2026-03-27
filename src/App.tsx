/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Linkedin, Twitter, Sparkles, Image as ImageIcon, Copy, Check, Loader2, Calendar, Download, Clock } from 'lucide-react';
import { generatePostContent, generatePostImage, SocialPost } from './services/gemini';

export default function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialPost | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [stats, setStats] = useState<{ generations: number; schedulings: number; downloads: number } | null>(null);

  const trackEvent = async (type: string, topic?: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, topic }),
      });
      fetchStats();
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);
    setImage(null);
    setError(null);
    setIsScheduled(false);

    try {
      const [content, img] = await Promise.all([
        generatePostContent(topic),
        generatePostImage(topic)
      ]);
      setResult(content);
      setImage(img);
      trackEvent('generation', topic);
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `jeyaul-post-${topic.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackEvent('download', topic);
  };

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select both date and time to schedule.');
      return;
    }
    setIsScheduled(true);
    trackEvent('scheduling', topic);
    setTimeout(() => setIsScheduled(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase text-orange-400 mb-6"
          >
            <Sparkles size={14} />
            AI Powered Content Engine
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
          >
            Jeyaul Post
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/40 max-w-xl mx-auto"
          >
            Generate high-impact social media posts for LinkedIn and Twitter in seconds.
          </motion.p>
        </header>

        <section className="mb-12">
          <form onSubmit={handleGenerate} className="relative group">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic (e.g., The future of AI in design)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-white text-black font-semibold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Generate
                  <Send size={18} />
                </>
              )}
            </button>
          </form>
        </section>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-mono text-sm"
            >
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex flex-col gap-8"
            >
              {/* LinkedIn Card - Larger and more prominent */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 text-blue-400">
                    <Linkedin size={32} />
                    <span className="text-2xl font-bold tracking-tight">LinkedIn Post</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-white/20 uppercase tracking-widest">
                      {result.linkedin.text.length} / 3000
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${result.linkedin.text}\n\n${result.linkedin.hashtags.join(' ')}`, 'li')}
                      className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
                      title="Copy to clipboard"
                    >
                      {copied === 'li' ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                  <div className="lg:col-span-3">
                    <p className="text-white/80 leading-relaxed text-lg mb-8 whitespace-pre-wrap">
                      {result.linkedin.text}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {result.linkedin.hashtags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 text-sm text-blue-400 font-medium border border-blue-500/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    {image && (
                      <div className="sticky top-8">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group shadow-2xl shadow-blue-500/5">
                          <img src={image} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                            <button
                              onClick={downloadImage}
                              className="bg-white text-black p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all"
                              title="Download Image"
                            >
                              <Download size={24} />
                            </button>
                            <span className="text-white text-xs font-mono uppercase tracking-widest">Download Asset</span>
                          </div>
                        </div>
                        <p className="mt-4 text-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
                          AI Generated Visual for LinkedIn
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Twitter Card - Secondary */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-sky-400">
                    <Twitter size={24} />
                    <span className="font-bold tracking-tight">Twitter / X Post</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                      {result.twitter.text.length + result.twitter.hashtags.join(' ').length + 2} / 280
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${result.twitter.text}\n\n${result.twitter.hashtags.join(' ')}`, 'tw')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                    >
                      {copied === 'tw' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed mb-6 whitespace-pre-wrap">
                  {result.twitter.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.twitter.hashtags.map((tag, i) => (
                    <span key={i} className="text-sm text-sky-400 font-medium">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Scheduling Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 md:p-12"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
                      <Calendar className="text-orange-500" />
                      Schedule for Later
                    </h3>
                    <p className="text-white/40 text-sm">Pick a future date and time to publish your post.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="date" 
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none text-white/80"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none text-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSchedule}
                      disabled={isScheduled}
                      className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        isScheduled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-black hover:bg-orange-500 hover:text-white'
                      }`}
                    >
                      {isScheduled ? (
                        <>
                          <Check size={20} />
                          Scheduled!
                        </>
                      ) : (
                        'Schedule Post'
                      )}
                    </button>
                  </div>
                </div>
                
                {isScheduled && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-6 text-green-400 font-mono text-xs uppercase tracking-widest"
                  >
                    Post successfully queued for {scheduleDate} at {scheduleTime}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <p className="text-white/40 font-mono text-sm animate-pulse">Crafting your viral content...</p>
          </div>
        )}

        {/* Analytics Dashboard */}
        {stats && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-24 pt-12 border-t border-white/5"
          >
            <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Sparkles size={20} />
              </div>
              <h4 className="text-sm font-mono uppercase tracking-[0.2em] text-white/40">Engagement Analytics</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.generations}</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total Generations</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.schedulings}</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Posts Scheduled</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.downloads}</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Assets Downloaded</div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-white/5 text-center text-white/20 text-xs font-mono uppercase tracking-widest">
        &copy; 2026 Jeyaul Post &bull; Powered by Gemini AI
      </footer>
    </div>
  );
}
