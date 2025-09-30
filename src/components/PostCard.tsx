import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: {
    id: string;
    content: string | null;
    media_url: string | null;
    media_type: string | null;
    created_at: string;
    user_id: string;
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
      username: string;
    };
  };
  currentUserId: string | undefined;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export const PostCard = ({ 
  post, 
  currentUserId, 
  likesCount = 0, 
  commentsCount = 0,
  isLiked = false,
  onLike,
  onComment 
}: PostCardProps) => {
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);

  const handleLike = async () => {
    if (!currentUserId) {
      toast({ title: 'Please sign in to like posts', variant: 'destructive' });
      return;
    }

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId);

      if (!error) {
        setLiked(false);
        setLikes(likes - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: currentUserId });

      if (!error) {
        setLiked(true);
        setLikes(likes + 1);
      }
    }
    onLike?.();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={post.profiles?.avatar_url || ''} />
          <AvatarFallback>
            {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.profiles?.display_name || post.profiles?.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {post.content && <p className="text-sm">{post.content}</p>}

      {post.media_url && post.media_type === 'image' && (
        <img 
          src={post.media_url} 
          alt="Post media" 
          className="w-full rounded-lg object-cover max-h-96"
        />
      )}

      {post.media_url && post.media_type === 'video' && (
        <video 
          src={post.media_url} 
          controls 
          className="w-full rounded-lg max-h-96"
        />
      )}

      <div className="flex items-center gap-4 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onComment}>
          <MessageCircle className="w-5 h-5" />
          <span>{commentsCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};
