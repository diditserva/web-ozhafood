import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderCode: id }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error('Error fetching order detail:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail pesanan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status pesanan tidak valid' },
        { status: 400 }
      );
    }

    const updated = await db.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status pesanan' },
      { status: 500 }
    );
  }
}
