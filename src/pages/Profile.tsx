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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar, { ProfileContext } from '@/components/ui/navbar';

type Profile = Database['public']['Tables']['profiles']['Row'];
type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];
type LeadRequest = Database['public']['Tables']['lead_requests']['Row'] & { status?: string | null; downloadable_url?: string | null };

const industryTypes = ["tech", "finance", "health", "education", "retail", "manufacturing", "consulting", "marketing", "other"] as const;
const roleTypes = ["founder", "developer", "marketer", "student", "manager", "consultant", "other"] as const;

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [leadRequests, setLeadRequests] = useState<LeadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [businessEditOpen, setBusinessEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [businessEditLoading, setBusinessEditLoading] = useState(false);
  const [editBusinessData, setEditBusinessData] = useState<Partial<BusinessProfile>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found.");
        // Always use avatar_url from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setProfile(data);
        setAvatarUrl(data?.avatar_url || null);
        setFullName(data?.full_name || '');

        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (businessError && businessError.code !== 'PGRST116') { // Ignore no rows found
          throw businessError;
        }
        setBusinessProfile(businessData);
        if (businessData) {
          setEditBusinessData(businessData);
        }

        const { data: requestsData, error: requestsError } = await supabase
          .from('lead_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (requestsError) {
          throw requestsError;
        }
        setLeadRequests(requestsData as LeadRequest[]);

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
  }, [toast]);

  // When opening the edit dialog, pre-fill fields with current values
  useEffect(() => {
    if (editOpen && profile) {
      setEditName(profile.full_name || '');
      setEditAvatarPreview(profile.avatar_url || '');
      setEditAvatar(null);
      setEditPassword('');
      setEditPasswordConfirm('');
    }
  }, [editOpen, profile]);

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
      console.log('Edit Profile: user', user);
      if (!user) throw new Error('User not found');
      const updates: { full_name: string; avatar_url?: string } = { full_name: editName };
      let newAvatarUrl = profile?.avatar_url || '';
      if (editAvatar) {
        const fileExt = editAvatar.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, editAvatar, { upsert: true });
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          throw uploadError;
        }
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
        updates.avatar_url = newAvatarUrl;
      }
      console.log('Edit Profile: updates', updates);
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }
      // Update password if provided
      if (editPassword) {
        if (editPassword !== editPasswordConfirm) throw new Error('Passwords do not match');
        const { error: pwError } = await supabase.auth.updateUser({ password: editPassword });
        if (pwError) {
          console.error('Password update error:', pwError);
          throw pwError;
        }
      }
      // Update local state so UI reflects changes instantly
      setProfile(prev => prev ? { ...prev, full_name: editName, avatar_url: newAvatarUrl } : prev);
      setAvatarUrl(newAvatarUrl);
      setFullName(editName);
      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
      setEditOpen(false);
      // No page reload
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      console.error('Edit Profile error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleBusinessProfileUpdate = async () => {
    setBusinessEditLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      if (!businessProfile) {
        if (!editBusinessData.business_name || !editBusinessData.industry || !editBusinessData.role) {
          toast({ title: 'Update failed', description: "Business name, industry and role are required.", variant: 'destructive' });
          setBusinessEditLoading(false);
          return;
        }
        const newProfileData = {
          user_id: user.id,
          business_name: editBusinessData.business_name,
          industry: editBusinessData.industry,
          role: editBusinessData.role,
          employee_count: editBusinessData.employee_count,
          business_goal: editBusinessData.business_goal,
        };
        const { error } = await supabase.from('business_profiles').insert(newProfileData);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('business_profiles').update(editBusinessData).eq('user_id', user.id);
        if (error) throw error;
      }
      
      toast({ title: 'Business profile updated', description: 'Your business information has been updated.' });
      setBusinessEditOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setBusinessEditLoading(false);
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
    <>
      <ProfileContext.Provider value={{ avatarUrl }}>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-end mb-4 space-x-2">
              {/* All buttons above the profile card removed as per user request */}
            </div>

            <Card className="w-full overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-primary to-primary-focus h-24" />
              <CardHeader className="text-center -mt-16">
                <Avatar className="w-28 h-28 mx-auto border-4 border-white shadow-md">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={fullName || ''} />
                  ) : (
                    <AvatarFallback className="text-3xl">
                      {getInitials(fullName || profile?.full_name || '')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <CardTitle className="text-3xl font-bold mt-4">{fullName || profile?.full_name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{profile?.email}</CardDescription>
                <Button onClick={() => setEditOpen(true)} variant="secondary" size="sm" className="mt-4">Edit Profile</Button>
              </CardHeader>
              <CardContent className="p-6">
                {businessProfile ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-primary">Business Details</h3>
                      <Button onClick={() => setBusinessEditOpen(true)} variant="secondary" size="sm">Edit Business Info</Button>
                    </div>
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
                        <Home className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-gray-500">Phone Number</p>
                          <p className="text-gray-800">{businessProfile.phone_no || 'N/A'}</p>
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

            <Dialog open={businessEditOpen} onOpenChange={setBusinessEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Business Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Business Name</label>
                    <Input value={editBusinessData.business_name || ''} onChange={e => setEditBusinessData({...editBusinessData, business_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Industry</label>
                    <Select
                      value={editBusinessData.industry || undefined}
                      onValueChange={value => setEditBusinessData({ ...editBusinessData, industry: value as typeof industryTypes[number] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryTypes.map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Your Role</label>
                    <Select
                      value={editBusinessData.role || undefined}
                      onValueChange={value => setEditBusinessData({ ...editBusinessData, role: value as typeof roleTypes[number] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleTypes.map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Employee Count</label>
                    <Input 
                      type="number" 
                      value={editBusinessData.employee_count ?? ''} 
                      onChange={e => setEditBusinessData({...editBusinessData, employee_count: e.target.value ? parseInt(e.target.value, 10) : null})} 
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Business Goal</label>
                    <Input value={editBusinessData.business_goal || ''} onChange={e => setEditBusinessData({...editBusinessData, business_goal: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleBusinessProfileUpdate} disabled={businessEditLoading} className="mt-4 w-full">
                  {businessEditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogContent>
            </Dialog>

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
                </div>
                <Button onClick={handleEditProfile} disabled={editLoading} className="mt-4 w-full">
                  {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </ProfileContext.Provider>
    </>
  );
};

export default ProfilePage; 