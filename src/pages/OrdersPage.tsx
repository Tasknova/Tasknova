import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/ui/navbar';
import type { Database } from '@/integrations/supabase/types';

// Types
// These should match your Supabase types
// You may need to adjust imports if your types are elsewhere

type LeadRequest = Database['public']['Tables']['lead_requests']['Row'] & { status?: string | null; downloadable_url?: string | null };

const OrdersPage: React.FC = () => {
  const [leadRequests, setLeadRequests] = useState<LeadRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found.');
        const { data: requestsData, error: requestsError } = await supabase
          .from('lead_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (requestsError) throw requestsError;
        setLeadRequests(requestsData as LeadRequest[]);
      } catch (error) {
        setLeadRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeadRequests();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-8">Your Orders</h1>
        <Card className="w-full overflow-hidden shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Lead Requests</CardTitle>
            <CardDescription>A history of all your lead generation requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : leadRequests.length > 0 ? (
              <ul className="space-y-4">
                {leadRequests.map((request) => (
                  <li key={request.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{request.lead_description}</p>
                      <p className="text-sm text-gray-500">
                        Requested on: {new Date(request.created_at).toLocaleString()}
                      </p>
                      {request.status?.toLowerCase().startsWith('failed') ? (
                        <p className="text-sm text-red-500">
                          Status: Failed. Our team will connect with you.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 capitalize">
                          Status: {request.status || 'Pending'}
                        </p>
                      )}
                    </div>
                    {request.downloadable_url && (
                      <Button asChild>
                        <a href={request.downloadable_url} target="_blank" rel="noopener noreferrer">
                          Download Leads
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">You haven't made any lead requests yet.</p>
            )}
          </CardContent>
        </Card>
        <Card className="w-full overflow-hidden shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Notion Templates Orders</CardTitle>
            <CardDescription>All your Notion Templates orders will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">No Notion Templates orders yet.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OrdersPage; 