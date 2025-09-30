import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Home, PlusSquare, Compass, User, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: PlusSquare, label: 'Upload', path: '/upload' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors flex-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('w-6 h-6', isActive && 'fill-primary')} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;