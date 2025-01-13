import { createClient } from './server'

export async function uploadPDF(file: File, userId: string, token: string) {
  const supabase = createClient(token)
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('papers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('papers')
    .getPublicUrl(fileName);

  return publicUrl;
} 