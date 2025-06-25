import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Building, Briefcase, Users, Target, Milestone, Home } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

type Profile = Database['public']['Tables']['profiles']['Row'];
type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const navigate = useNavigate();

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
        if (profileData) {
          setEditName(profileData.full_name || '');
          setEditAvatarPreview(profileData.avatar_url || '');
        }

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

  const handleEditProfile = async () => {
    setEditLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      const updates: { full_name: string; avatar_url?: string } = { full_name: editName };
      
      if (editAvatar) {
        const fileExt = editAvatar.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, editAvatar, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        updates.avatar_url = `${data.publicUrl}?t=${new Date().getTime()}`;
      }
      
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateError) throw updateError;
      
      // Update password if provided
      if (editPassword) {
        if (editPassword !== editPasswordConfirm) throw new Error('Passwords do not match');
        const { error: pwError } = await supabase.auth.updateUser({ password: editPassword });
        if (pwError) throw pwError;
      }
      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
      setEditOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAvatar(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
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
        <div className="flex justify-end mb-4 space-x-2">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button onClick={() => setEditOpen(true)} variant="secondary" size="sm">Edit Profile</Button>
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

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Full Name</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Avatar</label>
                <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                {editAvatarPreview && <img src={editAvatarPreview} alt="Avatar Preview" className="w-16 h-16 rounded-full mt-2" />}
              </div>
              <div>
                <label className="block mb-1 font-medium">New Password</label>
                <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Leave blank to keep current password" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Confirm Password</label>
                <Input type="password" value={editPasswordConfirm} onChange={e => setEditPasswordConfirm(e.target.value)} placeholder="Confirm new password" />
              </div>
              <Button className="w-full" onClick={handleEditProfile} disabled={editLoading}>
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfilePage; 