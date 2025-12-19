import { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles } from 'lucide-react';

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
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
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
    formattedDate: latestResult.formattedDate || new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
      <div className="bg-gradient-to-r from-neutral-900 via-amber-950/30 to-neutral-900 py-6 border-y border-amber-600/20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">
            <p className="text-sm">No results published yet. Check back soon!</p>
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
              <div className="bg-amber-900/40 backdrop-blur-sm rounded-lg px-5 py-3 border border-amber-600/30">
                <div className="text-white font-semibold text-base">{displayResult.name}</div>
                <div className="text-amber-300 text-sm flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{displayResult.time}</span>
                </div>
              </div>

              <div className="text-white text-base">
                <span className="text-amber-300">Result:</span>
                <span className="font-bold text-2xl ml-2 text-white">{displayResult.result}</span>
              </div>

              <div className="text-gray-300 text-sm">
                <div>{displayResult.formattedDate}</div>
                <div className="text-amber-400">Posted: {displayResult.postedAt}</div>
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