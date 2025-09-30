import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Grid, Video as VideoIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EditProfile } from '@/components/EditProfile';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      const { count: posts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: videos } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setPostsCount(posts || 0);
      setVideosCount(videos || 0);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Signed out successfully' });
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-shrink-0 overflow-y-auto border-b border-border bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Profile</h1>
            <Button size="icon" variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <h2 className="text-xl font-bold">{profile?.display_name}</h2>
            <p className="text-muted-foreground">@{profile?.username}</p>

            {profile?.bio && (
              <p className="text-sm mt-2 max-w-sm text-muted-foreground">{profile.bio}</p>
            )}

            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <p className="font-bold text-lg">{postsCount + videosCount}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{followersCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{followingCount}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>

            <Button onClick={() => setEditOpen(true)} className="mt-4 w-full max-w-sm">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {profile && (
        <EditProfile
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onUpdate={fetchProfile}
        />
      )}

      <Tabs defaultValue="posts" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4 flex-shrink-0 bg-card">
          <TabsTrigger value="posts" className="gap-2">
            <Grid className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <VideoIcon className="w-4 h-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="posts" className="mt-0 h-full">
            <div className="grid grid-cols-3 gap-1 p-1">
              {postsCount === 0 ? (
                <p className="col-span-3 text-center text-muted-foreground py-8">No posts yet</p>
              ) : (
                Array.from({ length: postsCount }).map((_, i) => (
                  <Card key={i} className="aspect-square overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-0 h-full bg-muted/50 flex items-center justify-center">
                      <Grid className="w-8 h-8 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-0 h-full">
            <div className="grid grid-cols-2 gap-2 p-2">
              {videosCount === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-8">No videos yet</p>
              ) : (
                Array.from({ length: videosCount }).map((_, i) => (
                  <Card key={i} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                    <div className="aspect-video bg-muted/50 flex items-center justify-center">
                      <VideoIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Profile;