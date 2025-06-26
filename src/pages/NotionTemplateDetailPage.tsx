import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Navbar from '@/components/ui/navbar';

type Template = {
  template_id: string;
  template_name: string;
  template_description: string;
  price_usd: number;
  cover_photo: string;
  face_photo: string;
  image_1: string;
  image_2: string;
  image_3: string;
  image_4: string;
  created_at: string;
};

const reviews = [
  { user_name: 'Alice', review_text: 'Amazing template! Super useful.', star_rating: 5 },
  { user_name: 'Bob', review_text: 'Helped me organize my work.', star_rating: 4 },
  { user_name: 'Charlie', review_text: 'Clean design and easy to use.', star_rating: 5 },
];

const NotionTemplateDetailPage: React.FC = () => {
  const { template_id } = useParams<{ template_id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!template_id) {
      setErrorMsg('No template_id in URL');
      setLoading(false);
      return;
    }
    console.log('template_id from URL:', template_id);
    const fetchTemplate = async () => {
      const { data, error } = await supabase
        .from('notion_templates')
        .select('*')
        .eq('template_id', template_id)
        .single();
      console.log('Supabase data:', data);
      console.log('Supabase error:', error);
      if (error) {
        setErrorMsg('Supabase error: ' + error.message);
        setTemplate(null);
      } else if (!data) {
        setErrorMsg('No data returned for template_id: ' + template_id);
        setTemplate(null);
      } else {
        setTemplate(data);
        setErrorMsg(null);
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [template_id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (errorMsg) return <div className="p-8 text-red-600">{errorMsg}<br/>template_id: {template_id}</div>;
  if (!template) return <div className="p-8">Template not found.<br/>template_id: {template_id}</div>;

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tasknova Home</h1>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <img src={template.cover_photo} alt={template.template_name ?? ''} className="rounded-lg w-full h-96 object-cover mb-4" />
            <CardTitle className="text-3xl">{template.template_name}</CardTitle>
            <CardDescription className="text-xl font-semibold">${template.price_usd}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">{template.template_description}</CardDescription>
            <div className="mb-6">
              <Carousel className="w-full">
                <CarouselContent>
                  {[template.image_1, template.image_2, template.image_3, template.image_4].filter((img): img is string => !!img).map((img, idx) => (
                    <CarouselItem key={idx}>
                      <img src={img} alt={`Template image ${idx + 1}`} className="rounded-lg h-80 w-2/3 mx-auto object-cover" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">User Reviews</h2>
              <div className="flex flex-row gap-4 overflow-x-auto pb-2">
                {reviews.map((review, idx) => (
                  <div key={idx} className="min-w-[250px] p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold mr-2">{review.user_name}</span>
                      <span>{'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}</span>
                    </div>
                    <div>{review.review_text}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <footer className="mt-12 text-center text-gray-400">&copy; {new Date().getFullYear()} Tasknova</footer>
      </div>
    </>
  );
};

export default NotionTemplateDetailPage; 