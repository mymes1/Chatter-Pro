import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Upload as UploadIcon, X } from 'lucide-react';
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
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const uploadAbortController = useRef<AbortController | null>(null);

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
    setUploadProgress(0);
    uploadAbortController.current = new AbortController();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Start upload in background
    const uploadPromise = (async () => {
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const videoFileName = `${user.id}/${Date.now()}.${fileExt}`;
        const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;

        // Upload video file
        setUploadProgress(20);
        const { error: videoError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, selectedFile, { contentType: selectedFile.type });

        if (videoError) throw videoError;

        setUploadProgress(50);
        
        // Create video element for duration (needed in both cases)
        const video = document.createElement('video');
        const videoObjectUrl = URL.createObjectURL(selectedFile);
        video.src = videoObjectUrl;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        let thumbnailBlob: Blob;
        
        // Use manual thumbnail if provided, otherwise auto-generate
        if (selectedThumbnail) {
          thumbnailBlob = selectedThumbnail;
        } else {
          // Seek to 1s (or 0s if shorter) to capture a representative frame
          const targetTime = Math.min(1, Math.max(0, (video.duration || 1) > 1 ? 1 : 0));
          await new Promise<void>((resolve) => {
            video.currentTime = targetTime;
            video.onseeked = () => resolve();
          });

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

          thumbnailBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
          });
        }

        URL.revokeObjectURL(videoObjectUrl);

        setUploadProgress(70);
        // Upload thumbnail
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailBlob, { contentType: 'image/jpeg' });

        if (thumbError) throw thumbError;

        setUploadProgress(90);
        // Get public URLs
        const { data: videoData } = supabase.storage.from('videos').getPublicUrl(videoFileName);
        const { data: thumbData } = supabase.storage.from('thumbnails').getPublicUrl(thumbnailFileName);

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

        setUploadProgress(100);
        toast({ title: 'Success', description: 'Video uploaded successfully!' });
        setVideoTitle('');
        setVideoDescription('');
        setSelectedFile(null);
        setSelectedThumbnail(null);
        
        // Allow user to navigate away
        return true;
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
        setUploadProgress(null);
      }
    })();

    // Show notification that upload is in progress
    toast({ 
      title: 'Upload started', 
      description: 'Video is uploading in background. You can navigate away.' 
    });

    // Allow immediate navigation
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
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Image className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">Custom Thumbnail (Optional)</p>
                    {selectedThumbnail && (
                      <div className="relative inline-block mb-3">
                        <img 
                          src={URL.createObjectURL(selectedThumbnail)} 
                          alt="Thumbnail preview" 
                          className="max-h-32 rounded-lg"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2"
                          onClick={() => setSelectedThumbnail(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      If not provided, will auto-generate from video
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !selectedFile}>
                    {loading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                  {uploadProgress !== null && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
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