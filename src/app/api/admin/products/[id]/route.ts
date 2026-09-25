import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(req, context);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const dataToUpdate: Record<string, any> = { ...body };
    if (dataToUpdate.price !== undefined) {
      const parsedPrice = parseInt(String(dataToUpdate.price), 10);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, error: 'Harga harus berupa angka positif.' },
          { status: 400 }
        );
      }
      dataToUpdate.price = parsedPrice;
    }

    if (dataToUpdate.name !== undefined) {
      dataToUpdate.name = String(dataToUpdate.name).trim();
      if (!dataToUpdate.name) {
        return NextResponse.json(
          { success: false, error: 'Nama menu tidak boleh kosong.' },
          { status: 400 }
        );
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const errDetail = error instanceof Error ? error.message : 'Kesalahan server';
    return NextResponse.json(
      { success: false, error: `Gagal merubah data produk: ${errDetail}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    const errDetail = error instanceof Error ? error.message : 'Kesalahan server';
    return NextResponse.json(
      { success: false, error: `Gagal menghapus produk: ${errDetail}` },
      { status: 500 }
    );
  }
}
