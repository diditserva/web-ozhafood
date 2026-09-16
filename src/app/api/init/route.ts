import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [products, divisions, locations] = await Promise.all([
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
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        divisions: divisions.map((d) => d.name),
        locations: locations.map((l) => l.name),
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
