import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LeadGenerationPage = () => {
  const [description, setDescription] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
      const { data, error } = await supabase.functions.invoke('send-to-n8n', {
        body: { description },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Function response:', data);
      toast({
        title: 'Success!',
        description: 'Your request has been sent. We will start generating your leads shortly.',
      });
    } catch (error: any) {
      console.error('Error invoking function:', error);
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold text-center mb-8">🎯 Get 100 Verified Leads – Only $20!</h1>

        <div className="max-w-2xl mx-auto">
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
  );
};

export default LeadGenerationPage; 