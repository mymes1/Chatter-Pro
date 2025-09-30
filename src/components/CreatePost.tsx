import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: 'Please enter some content', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: 'Please sign in to post', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert({ content, user_id: user.id });

    if (error) {
      toast({ title: 'Error creating post', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post created successfully!' });
      setContent('');
      onPostCreated?.();
    }
    setLoading(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Image className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-5 h-5" />
          </Button>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </Card>
  );
};
