import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chats from "./pages/Chats";
import Upload from "./pages/Upload";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ChatRoom from "./pages/ChatRoom";
import NewChat from "./pages/NewChat";
import Reels from "./pages/Reels";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/reels" element={<Reels />} />
          <Route path="/chats/:chatId" element={<ChatRoom />} />
          <Route path="/chats/new" element={<NewChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
