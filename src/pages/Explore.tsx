import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Video as VideoIcon, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views: number;
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface User {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

const Explore = () => {
  const [search, setSearch] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data: videosData } = await supabase
      .from('videos')
      .select(`
        *,
        profiles:user_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .order('views', { ascending: false })
      .limit(20);

    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);

    if (videosData) {
      setVideos(videosData.map(v => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        views: v.views,
        user: v.profiles,
      })));
    }

    if (usersData) {
      setUsers(usersData);
    }

    setLoading(false);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(search.toLowerCase()) ||
    video.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos, users, hashtags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="trending" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <VideoIcon className="w-4 h-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-2 gap-2 p-4">
              {loading ? (
                <p className="col-span-2 text-center text-muted-foreground py-8">Loading...</p>
              ) : filteredVideos.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-8">No videos found</p>
              ) : (
                filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <VideoIcon className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.views} views</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-0">
            <div className="grid grid-cols-2 gap-2 p-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <VideoIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.views} views</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        {user.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm">Follow</Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Explore;