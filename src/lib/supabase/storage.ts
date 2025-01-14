import { createClient } from './client';

const PAPERS_BUCKET = 'papers';

export async function uploadPDF(file: File, paperId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(PAPERS_BUCKET)
    .upload(`${paperId}/paper.pdf`, file);

  if (error) throw error;
  return data;
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