import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VideoPlayer = ({ 
  videoUrl, 
  thumbnailUrl, 
  className = '',
  autoPlay = false,
  muted = false,
  loop = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className="w-full h-full object-cover rounded-lg"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
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
      </div>
    </div>
  );
};
