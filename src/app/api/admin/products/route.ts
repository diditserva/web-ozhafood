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

    const parsedPrice = parseInt(String(price), 10);

    if (!name || typeof name !== 'string' || !name.trim() || isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Nama dan harga menu wajib diisi dengan benar.' },
        { status: 400 }
      );
    }

    const newProduct = await db.product.create({
      data: {
        name: name.trim(),
        price: parsedPrice,
        description: description ? String(description).trim() : '',
        imageUrl: imageUrl ? String(imageUrl).trim() : '',
        category: category ? String(category).trim() : 'Makanan',
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    const errDetail = error instanceof Error ? error.message : 'Kesalahan server';
    return NextResponse.json(
      { success: false, error: `Gagal menambahkan produk: ${errDetail}` },
      { status: 500 }
    );
  }
}
