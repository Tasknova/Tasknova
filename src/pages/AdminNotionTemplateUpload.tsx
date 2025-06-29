import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/ui/navbar';

const imageFields = [
  { name: 'cover_photo', label: 'Cover Photo' },
  { name: 'face_photo', label: 'Face Photo' },
];

const AdminNotionTemplateUpload: React.FC = () => {
  const [form, setForm] = useState({
    template_name: '',
    short_description: '',
    template_description: '',
    price_usd: '',
    cover_photo: null as File | null,
    face_photo: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as any;
    if (type === 'file') {
      setForm(f => ({ ...f, [name]: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Upload images and get file paths
      const imagePaths: Record<string, string | null> = {};
      for (const field of imageFields) {
        const file = (form as any)[field.name];
        if (file) {
          const filePath = `${form.template_name.replace(/\s+/g, '_')}_${Date.now()}/${field.name}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from('notion-templates').upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage.from('notion-templates').getPublicUrl(filePath);
          imagePaths[field.name] = urlData.publicUrl;
        } else {
          imagePaths[field.name] = null;
        }
      }
      // Insert into table
      const { error: insertError } = await supabase.from('notion_templates').insert({
        template_name: form.template_name,
        short_description: form.short_description,
        template_description: form.template_description,
        price_usd: Number(form.price_usd),
        cover_photo: imagePaths.cover_photo,
        face_photo: imagePaths.face_photo,
      });
      if (insertError) throw insertError;
      setMessage('Template added successfully!');
      setForm({
        template_name: '',
        short_description: '',
        template_description: '',
        price_usd: '',
        cover_photo: null,
        face_photo: null,
      });
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add Notion Template (Admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Template Name</label>
                <Input name="template_name" value={form.template_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Short Description</label>
                <Input name="short_description" value={form.short_description} onChange={handleChange} required maxLength={120} />
                <div className="text-xs text-gray-400">A brief summary (max 120 chars) for the templates page.</div>
              </div>
              <div>
                <label className="block font-medium mb-1">Template Description</label>
                <textarea name="template_description" value={form.template_description} onChange={handleChange} className="w-full border rounded p-2" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Price (USD)</label>
                <Input name="price_usd" type="number" value={form.price_usd} onChange={handleChange} required />
              </div>
              {imageFields.map(field => (
                <div key={field.name}>
                  <label className="block font-medium mb-1">{field.label}</label>
                  <Input name={field.name} type="file" accept="image/*" onChange={handleChange} />
                </div>
              ))}
              <Button type="submit" disabled={loading} className="w-full mt-4">
                {loading ? 'Uploading...' : 'Add Template'}
              </Button>
              {message && <div className="mt-2 text-center text-sm text-red-500">{message}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminNotionTemplateUpload; 