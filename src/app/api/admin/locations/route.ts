import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = await db.location.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil lokasi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama lokasi tidak boleh kosong' }, { status: 400 });
    }
    const created = await db.location.create({ data: { name: name.trim() } });
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    console.error('Error adding location:', error);
    return NextResponse.json({ success: false, error: 'Lokasi sudah ada atau gagal dibuat' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID lokasi dibutuhkan' }, { status: 400 });
    await db.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus lokasi' }, { status: 500 });
  }
}
