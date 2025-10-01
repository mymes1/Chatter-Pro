import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle as MessageIcon, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CreatePost } from '@/components/CreatePost';

interface Post {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const postsWithCounts = await Promise.all(
        data.map(async (post) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id || '')
            .single();

          return {
            id: post.id,
            content: post.content,
            media_url: post.media_url,
            media_type: post.media_type,
            created_at: post.created_at,
            user: post.profiles,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: !!likeData,
          };
        })
      );

      setPosts(postsWithCounts);
    }
    setLoading(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });
    }

    fetchPosts();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-border bg-background">
          <CreatePost onPostCreated={fetchPosts} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to share something!</p>
            <p className="text-sm text-muted-foreground">Create a post above or explore to find people to follow</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.user?.avatar_url || ''} />
                      <AvatarFallback>
                        {post.user?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{post.user?.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{post.user?.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>

                {post.content && (
                  <p className="mb-3 text-sm">{post.content}</p>
                )}

                {post.media_url && post.media_type?.startsWith('image') && (
                  <img
                    src={post.media_url}
                    alt="Post content"
                    className="w-full rounded-lg mb-3"
                  />
                )}

                {post.media_url && post.media_type?.startsWith('video') && (
                  <video
                    src={post.media_url}
                    controls
                    className="w-full rounded-lg mb-3"
                  />
                )}

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id, post.is_liked)}
                    className="gap-2"
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-sm">{post.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageIcon className="w-5 h-5" />
                    <span className="text-sm">{post.comments_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;