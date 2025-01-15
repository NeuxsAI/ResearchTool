import { createClient } from './server';

const PAPERS_BUCKET = 'papers';

export async function uploadPDF(file: File, userId: string, token: string) {
  const supabase = createClient(token);
  
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

export async function getPDFUrl(paperId: string) {
  const supabase = createClient();
  
  const { data } = await supabase.storage
    .from(PAPERS_BUCKET)
    .createSignedUrl(`${paperId}/paper.pdf`, 3600); // 1 hour expiry

  return data?.signedUrl;
}

export async function deletePDF(paperId: string) {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(PAPERS_BUCKET)
    .remove([`${paperId}/paper.pdf`]);

  if (error) throw error;
} 