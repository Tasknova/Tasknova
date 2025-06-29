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
  short_description?: string;
  price_usd: number;
  cover_photo: string;
  face_photo: string;
  categories?: string[];
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
      if (data && typeof data.Categories === 'string') {
        data.categories = data.Categories.split(',').map((cat: string) => cat.trim());
      } else if (data && Array.isArray(data.Categories)) {
        data.categories = data.Categories;
      }
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
      <div className="container mx-auto p-8">
        {/* Top section: Cover photo and right sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Cover photo and template info */}
          <div className="flex-1 min-w-0">
            <img
              src={template.cover_photo}
              alt={template.template_name ?? ''}
              className="rounded-lg w-full h-96 md:h-[32rem] object-cover mb-6 shadow-lg"
            />
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover bg-white shadow"
              />
              <div>
                <h1 className="text-3xl font-bold leading-tight">{template.template_name}</h1>
                {template.short_description && (
                  <div className="mt-1 text-base text-blue-700 font-semibold bg-blue-50 rounded px-2 py-1">
                    {template.short_description}
                  </div>
                )}
                {template.categories && template.categories.length > 0 && (
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="font-semibold">Categories:</span> {template.categories.join(', ')}
                  </div>
                )}
              </div>
            </div>
            
          </div>
          {/* Right: Features/benefits (sidebar) */}
          <aside className="w-full md:w-96 flex-shrink-0 bg-gray-50 rounded-lg p-6 shadow h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Features & Benefits</h2>
              <button className="px-6 py-2 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition">
                Get template (${template.price_usd})
              </button>
            </div>
            
            <div className="mt-6 text-gray-700 whitespace-pre-line">
              {template.template_description}
            </div>
            {template.categories && template.categories.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {template.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg shadow text-blue-800 font-medium text-sm min-w-[100px] justify-center">
                    <span>📦</span>
                    {cat}
                  </div>
                ))}
              </div>
            )}
            {/* Social Media Share Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this Notion template: ${window.location.href}`, '_blank')}
              >
                <span>🐦</span> Twitter
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded shadow"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
              >
                <span>📘</span> Facebook
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded shadow"
                onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}`, '_blank')}
              >
                <span>💼</span> LinkedIn
              </button>
            </div>
          </aside>
        </div>
        {/* Customer Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Customer Reviews</h2>
          <div className="flex gap-6 overflow-x-auto pb-2 justify-center">
            {reviews.map((review, idx) => (
              <div
                key={idx}
                className="min-w-[300px] max-w-xs bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 hover:shadow-2xl transition-shadow duration-200"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700 mb-2">
                  {review.user_name.charAt(0)}
                </div>
                <div className="font-semibold text-lg mb-1">{review.user_name}</div>
                <div className="flex items-center text-yellow-500 text-xl mb-2">
                  {'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}
                </div>
                <div className="text-gray-700 text-center text-base">{review.review_text}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Optionally, reviews or other sections can go here */}
        <footer className="mt-12 text-center text-gray-400">&copy; {new Date().getFullYear()} Tasknova</footer>
      </div>
    </>
  );
};

export default NotionTemplateDetailPage; 