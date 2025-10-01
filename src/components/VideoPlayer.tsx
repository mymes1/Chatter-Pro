import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  isActive?: boolean;
}

export const VideoPlayer = ({ 
  videoUrl, 
  thumbnailUrl, 
  className = '',
  autoPlay = false,
  muted = false,
  loop = false,
  isActive = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const userExitedFullscreen = useRef(false);

  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.play().catch(e => console.log('Play prevented:', e));
      setIsPlaying(true);
    } else if (videoRef.current && !isActive) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const checkOrientation = async () => {
      const landscape = window.innerWidth > window.innerHeight;
      const wasLandscape = isLandscape;
      setIsLandscape(landscape);

      // Reset user exit flag when changing from portrait to landscape
      if (landscape && !wasLandscape) {
        userExitedFullscreen.current = false;
      }

      // Auto fullscreen on landscape only if user hasn't manually exited
      if (landscape && !document.fullscreenElement && containerRef.current && isActive && !userExitedFullscreen.current) {
        try {
          await containerRef.current.requestFullscreen();
        } catch (error) {
          console.log('Auto fullscreen prevented:', error);
        }
      } else if (!landscape && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
          userExitedFullscreen.current = false;
        } catch (error) {
          console.log('Exit fullscreen prevented:', error);
        }
      }
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      
      // Track if user manually exited fullscreen while in landscape
      if (!inFullscreen && isLandscape) {
        userExitedFullscreen.current = true;
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // iOS Safari/Capacitor webkit fullscreen events on video elements
    const videoEl = videoRef.current as any;
    const handleWebkitBegin = () => {
      setIsFullscreen(true);
    };
    const handleWebkitEnd = () => {
      setIsFullscreen(false);
      if (isLandscape) {
        userExitedFullscreen.current = true;
      }
    };
    videoEl?.addEventListener?.('webkitbeginfullscreen', handleWebkitBegin);
    videoEl?.addEventListener?.('webkitendfullscreen', handleWebkitEnd);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      videoEl?.removeEventListener?.('webkitbeginfullscreen', handleWebkitBegin);
      videoEl?.removeEventListener?.('webkitendfullscreen', handleWebkitEnd);
    };
  }, [isActive, isLandscape]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.log('Play prevented:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const containerEl = containerRef.current;
    const videoEl = videoRef.current;
    if (!containerEl && !videoEl) return;

    try {
      if (!isFullscreen) {
        userExitedFullscreen.current = false;
        // Prefer container fullscreen; fallback to video element and WebKit
        if (containerEl?.requestFullscreen) {
          await containerEl.requestFullscreen();
        } else if (videoEl?.requestFullscreen) {
          await videoEl.requestFullscreen();
        } else {
          // iOS Safari fallback
          // @ts-ignore - webkitEnterFullscreen is not in the types
          if (videoEl && typeof (videoEl as any).webkitEnterFullscreen === 'function') {
            // @ts-ignore
            (videoEl as any).webkitEnterFullscreen();
          }
        }
      } else {
        userExitedFullscreen.current = true;
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (videoEl) {
          // @ts-ignore - Safari/iOS fallback
          if (typeof (videoEl as any).webkitExitFullscreen === 'function') {
            // @ts-ignore
            (videoEl as any).webkitExitFullscreen();
          }
          // Some iOS versions only allow exiting by pressing "Done"; state is updated via webkitendfullscreen
        }
      }
    } catch (error) {
      console.log('Fullscreen error:', error);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className} ${isFullscreen ? 'w-screen h-screen' : ''}`}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        muted={isMuted}
        loop={loop}
        playsInline
        className={`w-full h-full ${
          isFullscreen || isLandscape ? 'object-contain' : 'object-cover'
        }`}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={togglePlay}
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};
