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
      <div className="border-y border-[#7d6035]/60 bg-[linear-gradient(100deg,#4a0c47_0%,#4d18a3_36%,#751738_76%,#4b0d3b_100%)] py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="font-black text-[#ffe990]">Loading latest updates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!displayResult) {
    return (
      <div className="border-y border-[#7d6035]/60 bg-[linear-gradient(100deg,#4a0c47_0%,#4d18a3_36%,#751738_76%,#4b0d3b_100%)] py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="h-7 w-7 text-[#ffe990]" />
              <span className="text-xl font-black uppercase text-[#ffe990]">Latest Result</span>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-lg border border-[#be8b51]/70 bg-[#1c0b2f]/72 px-6 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffe990] border-t-transparent" aria-hidden="true"></div>
              <span className="text-lg font-bold text-white">Waiting for latest result...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-y border-[#7d6035]/60 bg-[linear-gradient(100deg,#4a0c47_0%,#4d18a3_36%,#751738_76%,#4b0d3b_100%)] py-5 shadow-[inset_0_1px_0_rgba(255,231,153,0.16)]">
      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-700 ease-out space-y-4 md:space-y-0 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Left side - Latest Result Info */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 flex-1">
            <div className="flex items-center space-x-3">
              <Trophy className="h-7 w-7 text-[#ffe990]" />
              <span className="text-2xl font-black uppercase text-[#ffe990] sm:text-3xl">Latest Result</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center justify-between gap-6 rounded-lg border border-[#be8b51]/70 bg-[#1c0b2f]/72 px-5 py-4 backdrop-blur-sm">
                <div className="min-w-0 text-base font-black leading-tight text-white">{displayResult.name}</div>
                <div className="flex shrink-0 items-center space-x-1 text-sm font-black text-[#ffe990]">
                  <Clock className="w-4 h-4" />
                  <span>{displayResult.time}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-0 py-2 text-base sm:justify-start">
                <span className="font-black text-[#ffe990]">Result:</span>
                <span className="ml-3 text-[2.6rem] font-black leading-none text-white">{displayResult.result}</span>
              </div>

              <div className="flex items-center justify-between px-0 py-2 text-sm sm:justify-start">
                <span className="font-black text-[#ffe990]">Posted:</span>
                <span className="ml-3 text-[2rem] font-black leading-none text-white sm:text-[2.6rem]">{displayResult.formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right side - Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="text-center text-sm font-black sm:text-left">
              <span className="text-[#ffe990]">Live Updates • 24/7 Results</span>
            </div>

            <div className="self-center rounded-full border border-[#d58a55] bg-[#8d1749]/85 px-6 py-3 shadow-lg sm:self-auto">
              <span className="text-sm font-black uppercase tracking-wide text-white">
                NEW
              </span>
            </div>
          </div>
        </div>

        {/* Scrolling text at bottom */}
        <div className="relative mt-4 overflow-hidden">
          <div
            className="whitespace-nowrap text-sm font-black text-[#ffe990]"
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
