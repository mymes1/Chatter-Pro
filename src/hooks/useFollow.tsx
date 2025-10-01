import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId: string | null) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
    }
  }, [targetUserId]);

  const checkFollowStatus = async () => {
    if (!targetUserId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!targetUserId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Please sign in to follow users', variant: 'destructive' });
      return;
    }

    if (user.id === targetUserId) {
      toast({ title: "You can't follow yourself", variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        toast({ title: 'Unfollowed successfully' });
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({ title: 'Following successfully' });
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast({ title: 'Failed to update follow status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, loading, toggleFollow };
};
