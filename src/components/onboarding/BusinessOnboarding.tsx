import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type IndustryType = Database['public']['Enums']['industry_type'];
type RoleType = Database['public']['Enums']['role_type'];
type ReferralSource = Database['public']['Enums']['referral_source'];

// Add country codes for dropdown
const countryCodes = [
  { code: '+1', label: 'US/Canada (+1)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+7', label: 'Russia (+7)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+92', label: 'Pakistan (+92)' },
];

interface BusinessFormData {
  businessName: string;
  industry: IndustryType | '';
  role: RoleType | '';
  referralSources: ReferralSource[];
  employeeCount: number;
  businessGoal: string;
  countryCode: string;
  phoneNo: string;
}

const BusinessOnboarding: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);

  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    industry: '',
    role: '',
    referralSources: [],
    employeeCount: 1,
    businessGoal: '',
    countryCode: '+1',
    phoneNo: '',
  });

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('business-onboarding-form');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('business-onboarding-form', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleReferralSourceChange = (source: ReferralSource, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      referralSources: checked
        ? [...prev.referralSources, source]
        : prev.referralSources.filter(s => s !== source)
    }));
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone.trim() === '') return 'Phone number is required.';
    if (!/^[0-9]{10}$/.test(phone)) return 'Enter a valid 10-digit phone number.';
    return '';
  };

  const handleVerifyPhone = () => {
    const err = validatePhone(formData.phoneNo);
    setPhoneError(err);
    if (!err) {
      setPhoneVerified(true);
      toast({ title: 'Phone Verified', description: 'Phone verification is not implemented in this demo.', variant: 'default' });
    } else {
      setPhoneVerified(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate phone before submit
    const err = validatePhone(formData.phoneNo);
    setPhoneError(err);
    if (err) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          business_name: formData.businessName,
          industry: formData.industry as IndustryType,
          role: formData.role as RoleType,
          referral_sources: formData.referralSources,
          employee_count: formData.employeeCount,
          business_goal: formData.businessGoal || null,
          phone_no: `${formData.countryCode}${formData.phoneNo}`,
        });

      if (error) throw error;

      // Clear saved form data
      localStorage.removeItem('business-onboarding-form');

      // Wait a moment and refetch business profile to ensure it's available for AuthGuard
      await new Promise(res => setTimeout(res, 700));
      const { data: profileCheck } = await supabase
        .from('business_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!profileCheck) {
        toast({ title: 'Profile not found after onboarding', description: 'Please try again.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Force session refresh
      await supabase.auth.getSession();
      // Optionally reload the page to ensure state is synced
      window.location.href = '/home';
      return;
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('business-onboarding-form');
  };

  const isFormValid = formData.businessName && formData.industry && formData.role && formData.referralSources.length > 0 && !validatePhone(formData.phoneNo);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Email Confirmed!</CardTitle>
            <CardDescription>
              Your email is confirmed! Please log in to continue onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Business Onboarding</h1>
            <p className="text-muted-foreground mt-2">Tell us about your business to get started</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Help us understand your business better to provide personalized experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  required
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(value: IndustryType) => setFormData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="health">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className="space-y-3">
                <Label>What best describes you? *</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value: RoleType) => setFormData(prev => ({ ...prev, role: value }))}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="founder" id="founder" />
                    <Label htmlFor="founder">Founder</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="developer" id="developer" />
                    <Label htmlFor="developer">Developer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="marketer" id="marketer" />
                    <Label htmlFor="marketer">Marketer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manager" id="manager" />
                    <Label htmlFor="manager">Manager</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="consultant" id="consultant" />
                    <Label htmlFor="consultant">Consultant</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="role-other" />
                    <Label htmlFor="role-other">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Referral Sources */}
              <div className="space-y-3">
                <Label>How did you hear about us? * (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {['google', 'youtube', 'friend', 'newsletter', 'social_media', 'advertisement', 'other'].map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={source}
                        checked={formData.referralSources.includes(source as ReferralSource)}
                        onCheckedChange={(checked) => 
                          handleReferralSourceChange(source as ReferralSource, checked as boolean)
                        }
                      />
                      <Label htmlFor={source} className="capitalize">
                        {source === 'social_media' ? 'Social Media' : source}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Count */}
              <div className="space-y-3">
                <Label>Number of employees: {formData.employeeCount}</Label>
                <Slider
                  value={[formData.employeeCount]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employeeCount: value[0] }))}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>1000+</span>
                </div>
              </div>

              {/* Business Goal */}
              <div className="space-y-2">
                <Label htmlFor="businessGoal">Business Goal (Optional)</Label>
                <Textarea
                  id="businessGoal"
                  placeholder="Tell us about your business goals and what you hope to achieve..."
                  value={formData.businessGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessGoal: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Phone Number (Required) */}
              <div className="space-y-2">
                <Label htmlFor="phoneNo">Phone Number <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 items-center">
                  <select
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={e => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                    className="border rounded px-2 py-2 bg-white"
                    style={{ minWidth: 110 }}
                  >
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <Input
                    id="phoneNo"
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={formData.phoneNo}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, phoneNo: e.target.value }));
                      setPhoneVerified(false);
                    }}
                    className="flex-1"
                    required
                  />
                  <Button type="button" variant={phoneVerified ? 'default' : 'outline'} size="sm" onClick={handleVerifyPhone}>
                    {phoneVerified ? 'Verified' : 'Verify'}
                  </Button>
                </div>
                {phoneError && <div className="text-red-500 text-sm mt-1">{phoneError}</div>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessOnboarding;

// SQL to add phone_no column:
// ALTER TABLE business_profiles ADD COLUMN phone_no VARCHAR(32);
