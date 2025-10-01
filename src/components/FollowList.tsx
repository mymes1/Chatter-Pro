import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFollow } from '@/hooks/useFollow';

interface Profile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface FollowListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTab?: 'followers' | 'following';
}

export const FollowList = ({ open, onOpenChange, userId, defaultTab = 'followers' }: FollowListProps) => {
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchFollowData();
    }
  }, [open, userId]);

  const fetchFollowData = async () => {
    setLoading(true);

    const { data: followersData } = await supabase
      .from('followers')
      .select('follower_id, profiles!followers_follower_id_fkey(id, display_name, username, avatar_url)')
      .eq('following_id', userId);

    const { data: followingData } = await supabase
      .from('followers')
      .select('following_id, profiles!followers_following_id_fkey(id, display_name, username, avatar_url)')
      .eq('follower_id', userId);

    if (followersData) {
      setFollowers(followersData.map((f: any) => f.profiles).filter(Boolean));
    }

    if (followingData) {
      setFollowing(followingData.map((f: any) => f.profiles).filter(Boolean));
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No followers yet</p>
            ) : (
              <div className="space-y-3">
                {followers.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : following.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Not following anyone yet</p>
            ) : (
              <div className="space-y-3">
                {following.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const UserListItem = ({ user }: { user: Profile }) => {
  const { isFollowing, loading, toggleFollow } = useFollow(user.id);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border-2 border-primary/20">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.display_name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{user.display_name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      <Button 
        size="sm" 
        variant={isFollowing ? 'outline' : 'default'}
        onClick={toggleFollow}
        disabled={loading}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
};
