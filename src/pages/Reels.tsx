import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Reels = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({ title: 'Error', description: 'Failed to load reels', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / itemHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading reels...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">No reels available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-background"
      onScroll={handleScroll}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      
      {videos.map((video, index) => (
        <div 
          key={video.id} 
          className="relative h-screen w-full snap-start flex items-center justify-center bg-black"
        >
          <VideoPlayer
            videoUrl={video.video_url}
            thumbnailUrl={video.thumbnail_url || undefined}
            className="h-full w-full max-w-md mx-auto"
            autoPlay={index === currentIndex}
            muted={false}
            loop
          />

          <div className="absolute bottom-20 left-4 right-20 text-white z-10">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarImage src={video.profiles.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {video.profiles.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{video.profiles.display_name || video.profiles.username}</p>
                <p className="text-sm text-white/80">@{video.profiles.username}</p>
              </div>
            </div>
            
            <h3 className="font-semibold mb-1">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-white/90 line-clamp-2">{video.description}</p>
            )}
          </div>

          <div className="absolute bottom-20 right-4 flex flex-col gap-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <Heart className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reels;
