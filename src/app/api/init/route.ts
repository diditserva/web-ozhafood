import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [products, divisions, locations, settings] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      db.division.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      db.location.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      getAppSettings(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        divisions: divisions.map((d) => d.name),
        locations: locations.map((l) => l.name),
        qrisUrl: settings.qrisUrl,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching init data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data awal sistem' },
      { status: 500 }
    );
  }
}
