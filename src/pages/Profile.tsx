import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Building, Briefcase, Users, Target, Milestone } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found.");

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (businessError && businessError.code !== 'PGRST116') { // Ignore no rows found
          throw businessError;
        }
        setBusinessProfile(businessData);

      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        toast({
          title: 'Failed to load profile',
          description: 'There was an error fetching your profile information.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Could not load profile.</p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="w-full overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary-focus h-24" />
          <CardHeader className="text-center -mt-16">
            <Avatar className="w-28 h-28 mx-auto border-4 border-white shadow-md">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.full_name || '')}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold mt-4">{profile.full_name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {businessProfile ? (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center text-primary">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                    <Building className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-500">Business Name</p>
                      <p className="text-gray-800">{businessProfile.business_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                    <Briefcase className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-500">Industry</p>
                      <p className="text-gray-800 capitalize">{businessProfile.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-500">Your Role</p>
                      <p className="text-gray-800 capitalize">{businessProfile.role}</p>
                    </div>
                  </div>
                   <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                    <Milestone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-500">Employee Count</p>
                      <p className="text-gray-800">{businessProfile.employee_count}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <Target className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-500">Business Goal</p>
                      <p className="text-gray-800">{businessProfile.business_goal}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>No business profile found.</p>
                <Button onClick={() => window.location.href = '/onboarding'} className="mt-4">
                  Complete Business Onboarding
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage; 