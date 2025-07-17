import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Eye, EyeOff, Upload, User, Home as HomeIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AuthForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const { toast } = useToast();
  // Remove showGoogleDialog, googleEmail, googleDialogError, checkUserExists, handleGoogleSignupDialogContinue
  // Restore Google OAuth signup button to directly call handleGoogleOAuth

  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const validateSignupForm = () => {
    if (!emailForm.fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }

    if (emailForm.password !== emailForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return false;
    }

    if (emailForm.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadProfilePicture = async (file: File, userId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (isSignUp && !validateSignupForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: emailForm.email,
          password: emailForm.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              full_name: emailForm.fullName,
              // The avatar_url will be updated after the user is created
            },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('User not created.');

        // Upload profile picture if provided
        let avatarUrl = '';
        if (profilePicture) {
          avatarUrl = (await uploadProfilePicture(profilePicture, data.user.id)) || '';
        }

        // Update user metadata with avatar URL
        if (avatarUrl) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl },
          });
          if (updateError) throw updateError;
        }

        toast({
          title: 'Account created!',
          description: 'Please check your email for a confirmation link.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailForm.email,
          password: emailForm.password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: "You've been logged in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? 'Sign up failed' : 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove googleIntent, checkUserExists for Google, and Google dialog logic
  // Add a simple handler for Google OAuth
  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Google authentication failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user exists in Supabase auth.users
  const checkUserExists = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) return false;
    return !!data;
  };

  // Remove handleGoogleSignupDialogContinue

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md relative">
        <a
          href="https://tasknova.io"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4"
          aria-label="Go to Tasknova Home"
        >
          <Button variant="ghost" size="icon" className="rounded-full">
            <HomeIcon className="h-6 w-6" />
          </Button>
        </a>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {authMode === 'signup' ? 'SignUp' : 'LogIn'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={emailForm.fullName}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('profilePicture')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Photo
                      </Button>
                      {profilePicturePreview && (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={emailForm.confirmPassword}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => handleEmailAuth(authMode === 'signup')}
                disabled={isLoading || !emailForm.email || !emailForm.password}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  authMode === 'signup' ? "Sign Up" : "Sign In"
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setEmailForm({ email: '', password: '', confirmPassword: '', fullName: '' });
                    setProfilePicture(null);
                    setProfilePicturePreview('');
                  }}
                >
                  {authMode === 'signin' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
          </div>

          {/* Google Auth Buttons */}
          {authMode === 'signup' ? (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={handleGoogleOAuth}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Sign up with Google</>)}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={handleGoogleOAuth}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Sign in with Google</>)}
            </Button>
          )}

          {/* Google Signup Dialog */}
          {/* Removed Google Signup Dialog */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
