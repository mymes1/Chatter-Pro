import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
  };
  other_user?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Chats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chats (
          id,
          name,
          is_group,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      const chatData = data.map(item => item.chats).filter(Boolean);
      setChats(chatData as any);
    }
    setLoading(false);
  };

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chats</h1>
          <Button size="icon" variant="ghost" onClick={() => navigate('/chats/new')}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No chats yet</p>
            <p className="text-sm text-muted-foreground">Start a conversation!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chats/${chat.id}`)}
                className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={chat.other_user?.avatar_url || ''} />
                  <AvatarFallback>
                    {chat.name?.[0]?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{chat.name || 'Chat'}</h3>
                    {chat.updated_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {chat.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;