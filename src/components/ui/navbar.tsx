import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, Layers, Zap, ShoppingCart } from 'lucide-react';

// Profile context for sharing avatarUrl
export const ProfileContext = React.createContext<{ avatarUrl?: string } | undefined>(undefined);

const navLinks = [
  { to: '/home', label: 'Home', icon: <Home className="inline-block w-5 h-5 mr-1" /> },
  { to: '/lead-generation', label: 'Lead Generation', icon: <Zap className="inline-block w-5 h-5 mr-1" /> },
  { to: '/notion-templates', label: 'Notion Templates', icon: <Layers className="inline-block w-5 h-5 mr-1" /> },
  { to: '/orders', label: 'Your Orders', icon: <Layers className="inline-block w-5 h-5 mr-1" /> },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Always use avatar_url from profiles table
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        setAvatarUrl(data?.avatar_url || null);
      } else {
        setAvatarUrl(null);
      }
    };
    getProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm mb-6">
      <div className="container mx-auto flex items-center gap-4 py-3 px-4">
        <Link to="/home" className="mr-4 flex items-center">
          <img src="/logo2.jpg" alt="Logo" className="w-20 h-20 object-contain" />
        </Link>
        {navLinks.filter(link => link.to !== '/orders').map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-2 rounded font-medium transition-colors duration-150 text-gray-700 hover:bg-gray-200 flex items-center`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
        <div className="ml-auto flex flex-row-reverse items-center gap-2">
          <Link to="/profile">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white border">
                <span>👤</span>
              </div>
            )}
          </Link>
          <Link to="/orders">
            <button className="px-3 py-2 rounded font-medium transition-colors duration-150 text-gray-700 hover:bg-gray-200 border border-gray-200 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Orders
            </button>
          </Link>
          {location.pathname.startsWith('/profile') && (
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded font-medium transition-colors duration-150 text-gray-700 hover:bg-gray-200 border border-gray-200"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 