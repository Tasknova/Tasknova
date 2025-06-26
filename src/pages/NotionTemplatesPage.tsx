import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/ui/navbar';

type Template = Tables<'notion_templates'>;

const NotionTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase.from('notion_templates').select('*');
      if (error) {
        console.error("Error fetching templates:", error);
      } else if (data) {
        setTemplates(data);
        console.log('Fetched templates:', data);
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tasknova Home</h1>
          {/* Footer or nav can be added here if needed */}
        </div>
        <h2 className="text-3xl font-bold mb-6">Notion Templates</h2>
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {templates.map(template => (
              <Card key={template.template_id} className="flex flex-col justify-between">
                <CardHeader>
                  <img src={template.face_photo} alt={template.template_name ?? 'Template'} className="rounded-t-lg h-56 object-cover w-full" />
                  <CardTitle>{template.template_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{template.template_description}</CardDescription>
                  <div className="mt-2 font-bold">${template.price_usd}</div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => navigate(`/notion-templates/${template.template_id}`)}>View</Button>
                    <Button variant="secondary">Buy Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <footer className="mt-12 text-center text-gray-400">&copy; {new Date().getFullYear()} Tasknova</footer>
      </div>
    </>
  );
};

export default NotionTemplatesPage; 