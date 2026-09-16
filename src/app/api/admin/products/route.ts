import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar produk' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, description, imageUrl, category, isActive = true } = body;

    if (!name || typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Nama dan harga menu wajib diisi dengan benar.' },
        { status: 400 }
      );
    }

    const newProduct = await db.product.create({
      data: {
        name,
        price,
        description: description || '',
        imageUrl: imageUrl || '',
        category: category || 'Makanan',
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan produk baru' },
      { status: 500 }
    );
  }
}
