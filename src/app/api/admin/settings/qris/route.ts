import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, updateAppSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({
      success: true,
      data: {
        qrisUrl: settings.qrisUrl,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching QRIS settings:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil pengaturan QRIS' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrisUrl } = body;

    if (!qrisUrl || typeof qrisUrl !== 'string' || !qrisUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'URL gambar QRIS tidak valid.' },
        { status: 400 }
      );
    }

    const updated = await updateAppSettings({ qrisUrl: qrisUrl.trim() });

    return NextResponse.json({
      success: true,
      data: {
        qrisUrl: updated.qrisUrl,
      },
      message: 'QRIS berhasil diperbarui!',
    });
  } catch (error: unknown) {
    console.error('Error updating QRIS settings:', error);
    const errDetail = error instanceof Error ? error.message : 'Kesalahan server';
    return NextResponse.json(
      { success: false, error: `Gagal menyimpan QRIS: ${errDetail}` },
      { status: 500 }
    );
  }
}
