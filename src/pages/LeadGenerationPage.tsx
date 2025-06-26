import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import Navbar from '@/components/ui/navbar';

const LeadGenerationPage = () => {
  const [description, setDescription] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (profile) {
          setFullName(profile.full_name || '');
        }
      }
    };

    fetchUser();
  }, []);

  const handlePayment = () => {
    setPaymentStatus('processing');
    toast({
      title: 'Processing Payment',
      description: 'Please wait while we process your payment.',
    });
    setTimeout(() => {
      setPaymentStatus('success');
      toast({
        title: 'Payment Successful',
        description: 'You can now generate your leads.',
      });
    }, 2000);
  };
  
  const handleGenerateLeads = async () => {
    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe your ideal leads first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to generate leads.');
      }

      // Insert into Supabase lead_requests table first
      const { data: insertDataArr, error: dbError } = await supabase
        .from('lead_requests')
        .insert({
          user_id: user.id,
          user_email: user.email!,
          user_name: fullName || user.email!,
          lead_description: description,
          status: 'running',
        })
        .select('id');
      const insertData = Array.isArray(insertDataArr) ? insertDataArr[0] : insertDataArr;
      if (dbError || !insertData) {
        console.error('Error inserting into lead_requests:', dbError);
        toast({
          title: 'Error',
          description: 'Failed to record your lead request. Please try again.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      // Now send the POST request to the webhook, including the id
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        console.error("VITE_N8N_WEBHOOK_URL is not set in the .env file.");
        throw new Error("Configuration error: Webhook URL not found.");
      }

      const payload = {
        id: insertData.id,
        lead_description: description,
        user_name: fullName || user.email!, // Fallback to email if name is not available
        user_email: user.email!,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`The webhook server responded with an error: ${response.status} ${errorText}`);
      }

      console.log('Successfully recorded in Supabase and sent data to n8n webhook.');
      toast({
        title: 'Success!',
        description: 'Please wait while we generate your leads. The leads will be sent to your email. It may take upto 25 to 30 mins to generate the leads',
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error sending data to webhook:', error);
      toast({
        title: 'Error Generating Leads',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerateLeads = termsAccepted && paymentStatus === 'success';

  const reviews = [
    {
      quote: "This pipeline is a game-changer for our business. We saw a 3x increase in qualified leads within the first month!",
      name: "John Doe, CEO of TechCorp",
      rating: 5,
    },
    {
      quote: "The quality of leads is outstanding. It's like having a dedicated lead generation team working for you 24/7.",
      name: "Jane Smith, Marketing Manager",
      rating: 5,
    },
    {
      quote: "I was skeptical at first, but the results speak for themselves. Highly recommended for any sales team.",
      name: "Sam Wilson",
      rating: 4,
    }
  ];

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <h1 className="text-4xl font-bold text-center mb-8">🎯 Get 100 Verified Leads – Only $20!</h1>

          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="p-8 text-center bg-white rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Thank you!</h2>
                <p className="text-lg">Please wait while we generate your leads.<br/>The leads will be sent to your email. It may take upto 25 to 30 mins to generate the leads</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Describe Your Ideal Leads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Examples:&#10;- Marketing agency owners or founders in India&#10;- Sales Managers in Pune with team size > 10&#10;- Marketing agencies with 20-40 employees in India"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px] text-base"
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the <a href="#" className="underline">Terms & Privacy Policy</a>
                    </label>
                  </div>

                  {paymentStatus !== 'success' && (
                    <Button 
                      onClick={handlePayment} 
                      className="w-full" 
                      disabled={paymentStatus === 'processing' || !termsAccepted || !description.trim()}
                    >
                      {paymentStatus === 'processing' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Pay to Continue'
                      )}
                    </Button>
                  )}

                  <Button 
                    className="w-full" 
                    disabled={!canGenerateLeads || isGenerating} 
                    onClick={handleGenerateLeads}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Leads'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <section className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
            <Carousel className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
              <CarouselContent>
                {reviews.map((review, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                          <p className="text-center">"{review.quote}"</p>
                          <div className="text-center">
                            <p className="font-semibold">{review.name}</p>
                            <p className="text-sm text-muted-foreground">{'⭐'.repeat(review.rating)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>

        </main>
        <footer className="w-full text-center p-4">
          <p>© 2025 All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default LeadGenerationPage; 