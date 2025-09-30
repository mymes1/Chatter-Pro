import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.play().catch(e => console.log('Play prevented:', e));
      setIsPlaying(true);
    } else if (videoRef.current && !isActive) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

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

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        muted={isMuted}
        loop={loop}
        playsInline
        className="w-full h-full object-cover"
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

      <div className="absolute bottom-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};
