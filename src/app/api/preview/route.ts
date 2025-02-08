import { NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const { pdfPath } = await request.json();
    if (!pdfPath) {
      return NextResponse.json({ error: 'PDF path is required' }, { status: 400 });
    }

    const previewsDir = join(process.cwd(), 'public', 'previews');
    await fs.mkdir(previewsDir, { recursive: true });

    const previewId = uuidv4();
    const previewPath = join(previewsDir, `${previewId}.jpg`);

    await execPromise(`pdftoppm -jpeg -f 1 -l 1 -scale-to 800 "${pdfPath}" "${previewPath.replace('.jpg', '')}"`);
    await fs.rename(`${previewPath.replace('.jpg', '')}-1.jpg`, previewPath);

    return NextResponse.json({ previewUrl: `/previews/${previewId}.jpg` });
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
