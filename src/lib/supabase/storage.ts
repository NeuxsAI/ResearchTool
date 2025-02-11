import { createClient } from './server';
import { cookies } from 'next/headers';

const PAPERS_BUCKET = 'papers';

export async function uploadPDF(file: File, userId: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).slice(2)}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(PAPERS_BUCKET)
      .upload(fileName, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PAPERS_BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

export async function downloadAndUploadPDF(url: string, userId: string, paperId: string) {
  const supabase = createClient();
  
  try {
    // Download the PDF
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download PDF');
    
    const pdfBlob = await response.blob();
    const fileName = `${userId}/${paperId}/paper.pdf`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(PAPERS_BUCKET)
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PAPERS_BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error downloading/uploading PDF:', error);
    throw error;
  }
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