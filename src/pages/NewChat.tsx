import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const NewChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [search]);

  const searchUsers = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${search}%`)
      .neq('id', user.id)
      .limit(20);

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const createChat = async (otherUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if chat already exists
    const { data: existingChats } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', user.id);

    if (existingChats) {
      for (const chatMember of existingChats) {
        const { data: otherMembers } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chatMember.chat_id)
          .neq('user_id', user.id);

        if (otherMembers?.length === 1 && otherMembers[0].user_id === otherUserId) {
          navigate(`/chats/${chatMember.chat_id}`);
          return;
        }
      }
    }

    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ is_group: false })
      .select()
      .single();

    if (chatError || !chat) {
      toast({ title: 'Failed to create chat', variant: 'destructive' });
      return;
    }

    // Add members
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert([
        { chat_id: chat.id, user_id: user.id },
        { chat_id: chat.id, user_id: otherUserId }
      ]);

    if (membersError) {
      toast({ title: 'Failed to add members', variant: 'destructive' });
      return;
    }

    navigate(`/chats/${chat.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Button size="icon" variant="ghost" onClick={() => navigate('/chats')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">New Chat</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-muted-foreground">
              {search.trim() ? 'No users found' : 'Search for users by username'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => createChat(user.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback>
                    {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{user.display_name || user.username}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChat;
