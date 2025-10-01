import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationPrompt = () => {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after 5 seconds if notifications are supported and not yet granted/denied
    const timer = setTimeout(() => {
      if (isSupported && permission === 'default' && !dismissed) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSupported, permission, dismissed]);

  const handleEnableClick = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || !isSupported || permission !== 'default') return null;

  return (
    <Card className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg z-50 animate-in slide-in-from-top-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Enable Notifications</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Stay updated with new messages and activity. We'll only send important notifications.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleEnableClick} 
              size="sm"
              className="flex-1"
            >
              Enable
            </Button>
            <Button 
              onClick={handleDismiss} 
              variant="outline" 
              size="sm"
            >
              Later
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

export default NotificationPrompt;
