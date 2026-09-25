import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Kredensial Cloudinary belum lengkap di file .env. Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET sudah diisi.',
        },
        { status: 400 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
      timeout: 60000,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'ozhafood/products';
    const isQris = folder.includes('qris');

    if (!file) {
      return NextResponse.json({ success: false, error: 'File gambar tidak ditemukan' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary stream with automatic compression & resizing
    const transformation = isQris
      ? [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:best' }]
      : [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation,
          timeout: 60000,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload gagal'));
          } else {
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunggah gambar ke Cloudinary' },
      { status: 500 }
    );
  }
}
