import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Profile context for sharing avatarUrl
export const ProfileContext = React.createContext<{ avatarUrl?: string } | undefined>(undefined);

const navLinks = [
  { to: '/home', label: 'Home' },
  { to: '/lead-generation', label: 'Lead Generation' },
  { to: '/notion-templates', label: 'Notion Templates' },
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
        {/* Navigation links, hide the one for the current page */}
        {navLinks.map(link =>
          !location.pathname.startsWith(link.to) && (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded font-medium transition-colors duration-150 text-gray-700 hover:bg-gray-200`}
            >
              {link.label}
            </Link>
          )
        )}
        {/* Profile avatar and Sign Out button on the right, sign out only on /profile */}
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