import { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles } from 'lucide-react';
import { formatGameDate } from '../utils/timezone';

interface LatestResult {
  gameName?: string;
  name?: string;
  result?: string;
  publishedNumber?: string;
  time?: string;
  formattedDate?: string;
  date?: string;
  postedAt?: string;
}

interface LatestUpdatesProps {
  latestResult?: LatestResult;
  isLoading?: boolean;
}

function LatestUpdates({ latestResult, isLoading = false }: LatestUpdatesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [flashBadge, setFlashBadge] = useState(false);

  useEffect(() => {
    // Animate in when component mounts or result changes
    if (latestResult) {
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true); // Default to visible for empty state
    }
  }, [latestResult]);

  useEffect(() => {
    // Flash the badge every 3 seconds
    const interval = setInterval(() => {
      setFlashBadge(true);
      setTimeout(() => setFlashBadge(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const displayResult = latestResult ? {
    ...latestResult,
    name: latestResult.name || latestResult.gameName || 'Unknown Game',
    result: latestResult.result || latestResult.publishedNumber || '0',
    time: latestResult.time || '00:00 AM',
    formattedDate: latestResult.formattedDate || (latestResult.date ? formatGameDate(latestResult.date) : 'Today')
  } : null;

  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 py-4 border-y-2 border-yellow-400/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white font-semibold">Loading latest updates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!displayResult) {
    return (
      <div className="bg-gradient-to-r from-neutral-900 via-amber-950/30 to-neutral-900 py-6 border-y border-amber-600/20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="h-7 w-7 text-amber-400" />
              <span className="text-xl font-bold text-white">Latest Result</span>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-xl border border-amber-600/40 bg-amber-950/50 px-6 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" aria-hidden="true"></div>
              <span className="text-lg font-bold text-white">Waiting for latest result...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-amber-950/30 to-neutral-900 py-6 border-y border-amber-600/20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-700 ease-out space-y-4 md:space-y-0 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Left side - Latest Result Info */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 flex-1">
            <div className="flex items-center space-x-3">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span className="text-white font-bold text-xl">Latest Result</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center justify-between gap-6 bg-amber-900/40 backdrop-blur-sm rounded-lg px-5 py-4 border border-amber-600/30">
                <div className="min-w-0 text-3xl font-bold leading-tight text-white">{displayResult.name}</div>
                <div className="flex shrink-0 items-center space-x-1 text-base font-semibold text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>{displayResult.time}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 to-green-900/50 px-5 py-4 text-base shadow-lg shadow-emerald-950/20 sm:justify-start">
                <span className="font-semibold text-emerald-300">Result:</span>
                <span className="ml-3 text-2xl font-black text-white">{displayResult.result}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-sky-500/40 bg-gradient-to-r from-slate-900/90 to-sky-950/70 px-5 py-4 text-sm shadow-lg shadow-sky-950/20 sm:justify-start">
                <span className="font-semibold text-sky-300">Posted:</span>
                <span className="ml-3 text-2xl font-bold text-white">{displayResult.formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right side - Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="text-gray-300 text-sm font-medium text-center sm:text-left">
              <span className="text-amber-300">Live Updates • 24/7 Results</span>
            </div>

            <div className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full border border-amber-500 shadow-lg self-center sm:self-auto">
              <span className="text-white font-bold text-sm tracking-wide">
                NEW
              </span>
            </div>
          </div>
        </div>

        {/* Scrolling text at bottom */}
        <div className="mt-4 overflow-hidden relative">
          <div
            className="whitespace-nowrap text-amber-200 font-medium text-sm"
            style={{
              animation: 'scroll-left 30s linear infinite'
            }}
          >
            • {displayResult.name} Result: {displayResult.result} • Posted at {displayResult.time} •
            Check Live Results • Play Responsibly • 100% Accurate Results •
            Trusted by Thousands • 24/7 Support Available •
            {displayResult.name} Result: {displayResult.result} • Posted at {displayResult.time} •
            Check Live Results • Play Responsibly • 100% Accurate Results •
            Trusted by Thousands • 24/7 Support Available •
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes scroll-left {
              0% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
          `
        }} />
      </div>
    </div>
  );
}

export default LatestUpdates;
