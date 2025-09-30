import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Film, Upload as UploadIcon } from 'lucide-react';
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
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [selectedReelFile, setSelectedReelFile] = useState<File | null>(null);

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

    try {
      // Generate unique file names
      const fileExt = selectedFile.name.split('.').pop();
      const videoFileName = `${user.id}/${Date.now()}.${fileExt}`;
      const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;

      // Upload video file
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, selectedFile);

      if (videoError) throw videoError;

      // Generate thumbnail from video
      const video = document.createElement('video');
      video.src = URL.createObjectURL(selectedFile);
      video.currentTime = 1;
      
      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve();
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Convert canvas to blob
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      // Upload thumbnail
      const { error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbnailFileName, thumbnailBlob);

      if (thumbError) throw thumbError;

      // Get public URLs
      const { data: videoData } = supabase.storage.from('videos').getPublicUrl(videoFileName);
      const { data: thumbData } = supabase.storage.from('thumbnails').getPublicUrl(thumbnailFileName);

      // Get video duration
      const duration = Math.round(video.duration);

      // Create video entry in database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: videoTitle,
          description: videoDescription,
          video_url: videoData.publicUrl,
          thumbnail_url: thumbData.publicUrl,
          duration,
        });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Video uploaded successfully!' });
      setVideoTitle('');
      setVideoDescription('');
      setSelectedFile(null);
      navigate('/explore');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background">
        <h1 className="text-2xl font-bold">Create</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="post" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="post" className="gap-2">
              <Image className="w-4 h-4" />
              Post
            </TabsTrigger>
            <TabsTrigger value="reel" className="gap-2">
              <Film className="w-4 h-4" />
              Reel
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

          <TabsContent value="reel">
            <Card>
              <CardHeader>
                <CardTitle>Upload Reel</CardTitle>
                <CardDescription>Share short vertical videos (max 60 seconds)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedReelFile) return;

                  setLoading(true);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
                    setLoading(false);
                    return;
                  }

                  try {
                    const fileExt = selectedReelFile.name.split('.').pop();
                    const videoFileName = `${user.id}/${Date.now()}_reel.${fileExt}`;
                    const thumbnailFileName = `${user.id}/${Date.now()}_reel_thumb.jpg`;

                    const { error: videoError } = await supabase.storage
                      .from('videos')
                      .upload(videoFileName, selectedReelFile);

                    if (videoError) throw videoError;

                    const video = document.createElement('video');
                    video.src = URL.createObjectURL(selectedReelFile);
                    video.currentTime = 1;
                    
                    await new Promise<void>((resolve) => {
                      video.onloadeddata = () => resolve();
                    });

                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(video, 0, 0);

                    const thumbnailBlob = await new Promise<Blob>((resolve) => {
                      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
                    });

                    const { error: thumbError } = await supabase.storage
                      .from('thumbnails')
                      .upload(thumbnailFileName, thumbnailBlob);

                    if (thumbError) throw thumbError;

                    const { data: videoData } = supabase.storage.from('videos').getPublicUrl(videoFileName);
                    const { data: thumbData } = supabase.storage.from('thumbnails').getPublicUrl(thumbnailFileName);

                    const duration = Math.round(video.duration);

                    const { error: dbError } = await supabase
                      .from('videos')
                      .insert({
                        user_id: user.id,
                        title: reelTitle,
                        description: reelDescription,
                        video_url: videoData.publicUrl,
                        thumbnail_url: thumbData.publicUrl,
                        duration,
                      });

                    if (dbError) throw dbError;

                    toast({ title: 'Success', description: 'Reel uploaded successfully!' });
                    setReelTitle('');
                    setReelDescription('');
                    setSelectedReelFile(null);
                    navigate('/reels');
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  } finally {
                    setLoading(false);
                  }
                }} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Reel title"
                      value={reelTitle}
                      onChange={(e) => setReelTitle(e.target.value)}
                      required
                    />
                  </div>
                  <Textarea
                    placeholder="Reel description (optional)"
                    value={reelDescription}
                    onChange={(e) => setReelDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setSelectedReelFile(e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload vertical videos up to 60 seconds
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !selectedReelFile}>
                    {loading ? 'Uploading...' : 'Upload Reel'}
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