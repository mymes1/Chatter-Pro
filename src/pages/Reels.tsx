import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Reels = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchVideos();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

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
      
      const videosData = data || [];
      setVideos(videosData);
      
      // If videoId is provided, find its index
      if (videoId) {
        const index = videosData.findIndex(v => v.id === videoId);
        if (index !== -1) {
          setCurrentIndex(index);
          // Scroll to the video
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: index * window.innerHeight,
                behavior: 'instant' as ScrollBehavior
              });
            }
          }, 100);
        }
      }
      
      // Fetch likes for all videos
      if (currentUserId) {
        fetchLikesForVideos(videosData.map(v => v.id));
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({ title: 'Error', description: 'Failed to load reels', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLikesForVideos = async (videoIds: string[]) => {
    try {
      const { data: likesData } = await supabase
        .from('likes')
        .select('video_id, user_id')
        .in('video_id', videoIds);

      const likesMap: Record<string, { isLiked: boolean; count: number }> = {};
      
      videoIds.forEach(videoId => {
        const videoLikes = likesData?.filter(l => l.video_id === videoId) || [];
        likesMap[videoId] = {
          count: videoLikes.length,
          isLiked: videoLikes.some(l => l.user_id === currentUserId)
        };
      });
      
      setLikes(likesMap);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleLike = async (videoId: string) => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'Please log in to like videos', variant: 'destructive' });
      return;
    }

    const currentLike = likes[videoId] || { isLiked: false, count: 0 };
    
    try {
      if (currentLike.isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', currentUserId);
        
        setLikes(prev => ({
          ...prev,
          [videoId]: { isLiked: false, count: prev[videoId].count - 1 }
        }));
      } else {
        await supabase
          .from('likes')
          .insert({ video_id: videoId, user_id: currentUserId });
        
        setLikes(prev => ({
          ...prev,
          [videoId]: { isLiked: true, count: prev[videoId].count + 1 }
        }));
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCommentClick = async (videoId: string) => {
    setSelectedVideoId(videoId);
    setCommentDialogOpen(true);
    await fetchComments(videoId);
  };

  const fetchComments = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handlePostComment = async () => {
    if (!currentUserId || !selectedVideoId || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: selectedVideoId,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments(selectedVideoId);
      toast({ title: 'Success', description: 'Comment posted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleShare = async (video: Video) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/reels/' + video.id);
      toast({ title: 'Success', description: 'Link copied to clipboard!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
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
    <>
      <div 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`::-webkit-scrollbar { display: none; }`}</style>
        
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="relative h-screen w-full snap-start flex items-center justify-center bg-black"
          >
            <VideoPlayer
              videoUrl={video.video_url}
              thumbnailUrl={video.thumbnail_url || undefined}
              className="h-full w-full max-w-md mx-auto"
              isActive={index === currentIndex}
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
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-12 h-12 rounded-full hover:bg-white/30 backdrop-blur-sm ${
                    likes[video.id]?.isLiked ? 'bg-primary/80 text-white' : 'bg-white/20 text-white'
                  }`}
                  onClick={() => handleLike(video.id)}
                >
                  <Heart className={`w-6 h-6 ${likes[video.id]?.isLiked ? 'fill-white' : ''}`} />
                </Button>
                {likes[video.id]?.count > 0 && (
                  <span className="text-white text-xs mt-1">{likes[video.id].count}</span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                onClick={() => handleCommentClick(video.id)}
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                onClick={() => handleShare(video)}
              >
                <Share2 className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {comment.profiles.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{comment.profiles.display_name || comment.profiles.username}</p>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[60px]"
            />
            <Button onClick={handlePostComment} disabled={!newComment.trim()}>
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reels;
