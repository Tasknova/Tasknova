import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import Navbar from '@/components/ui/navbar';

const HomePage = () => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setFullName(profile.full_name);
        }
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tasknova Market Place</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card onClick={() => navigate('/lead-generation')} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 1" className="rounded-t-lg" />
              <CardTitle>🎯 Get 100 Verified Leads – Only $20!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              Kickstart your growth with our ready-to-use Lead Generation Pipeline. Instantly access 100 high-quality leads tailored to your niche — all for just $20. No setup hassle, no fluff — just real, targeted prospects to fuel your outreach, campaigns, or sales funnel, and help you grow faster.
              </CardDescription>
              <Button className="mt-4">Check this Out</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 2" className="rounded-t-lg" />
              <CardTitle>🧩 Agency OS Template – Run Your Agency Like a Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              Run your agency with clarity using the Agency OS Template — a powerful, all-in-one workspace to manage clients, track projects, and streamline operations. Built for digital and service agencies that want scalable systems, smarter workflows, and everything in one organized space.
              </CardDescription>
              <Button className="mt-4">Click Me</Button>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/notion-templates')} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 3" className="rounded-t-lg" />
              <CardTitle>📚 Notion Templates – Plug & Play Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              Unlock focus and flow with Tasknova's premium Notion Templates Library. From task managers to CRMs and habit trackers, each template is designed to simplify life, organize your work, and boost productivity — whether you're a freelancer, startup, or creator ready to level up.
              </CardDescription>
              <Button className="mt-4">Click Me</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 4" className="rounded-t-lg" />
              <CardTitle>Card Title 4</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                This is a description for card 4. You can put more detailed information here.
              </CardDescription>
              <Button className="mt-4">Click Me</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 5" className="rounded-t-lg" />
              <CardTitle>Card Title 5</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                This is a description for card 5. You can put more detailed information here.
              </CardDescription>
              <Button className="mt-4">Click Me</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <img src="/placeholder.svg" alt="Placeholder 6" className="rounded-t-lg" />
              <CardTitle>Card Title 6</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                This is a description for card 6. You can put more detailed information here.
              </CardDescription>
              <Button className="mt-4">Click Me</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="mt-12 text-center text-gray-400">&copy; {new Date().getFullYear()} Tasknova</footer>
    </>
  );
};

export default HomePage; 