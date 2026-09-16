import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = await db.division.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error fetching divisions:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil divisi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama divisi tidak boleh kosong' }, { status: 400 });
    }
    const created = await db.division.create({ data: { name: name.trim() } });
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    console.error('Error adding division:', error);
    return NextResponse.json({ success: false, error: 'Divisi sudah ada atau gagal dibuat' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID divisi dibutuhkan' }, { status: 400 });
    await db.division.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting division:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus divisi' }, { status: 500 });
  }
}
