import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Upload as UploadIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: postContent,
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Post created!' });
      setPostContent('');
      navigate('/');
    }
    setLoading(false);
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // For now, just create the video entry without actual file upload
    // You'll need to set up Supabase Storage for actual file uploads
    const { error } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: videoTitle,
        description: videoDescription,
        video_url: 'placeholder', // Replace with actual storage URL
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Video uploaded!' });
      setVideoTitle('');
      setVideoDescription('');
      setSelectedFile(null);
      navigate('/explore');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background">
        <h1 className="text-2xl font-bold">Create</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="post" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post" className="gap-2">
              <Image className="w-4 h-4" />
              Post
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="post">
            <Card>
              <CardHeader>
                <CardTitle>Create a Post</CardTitle>
                <CardDescription>Share what's on your mind</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Textarea
                    placeholder="What's happening?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[150px] resize-none"
                    required
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Posting...' : 'Post'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>Upload Video</CardTitle>
                <CardDescription>Share videos up to 1 hour long</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVideoUpload} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Video title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      required
                    />
                  </div>
                  <Textarea
                    placeholder="Video description"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload videos up to 1 hour
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !selectedFile}>
                    {loading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Upload;