import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('targetDate'); // YYYY-MM-DD
    const division = searchParams.get('division');
    const location = searchParams.get('location');
    const status = searchParams.get('status') as OrderStatus | null;
    const search = searchParams.get('search');

    const whereClause: Record<string, unknown> = {};

    if (targetDate) {
      // match specific date
      const date = new Date(targetDate);
      whereClause.targetDate = {
        equals: date,
      };
    }

    if (division) {
      whereClause.division = division;
    }

    if (location) {
      whereClause.location = location;
    }

    if (status && Object.values(OrderStatus).includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pesanan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      division,
      location,
      targetDate,
      notes,
      paymentMethod = 'QRIS',
      items, // Array of { productId, productName, unitPrice, quantity, subtotal }
    } = body;

    if (!customerName || !division || !location || !targetDate) {
      return NextResponse.json(
        { success: false, error: 'Informasi pemesan dan tanggal pesanan wajib diisi.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pesanan minimal berisi 1 menu pilihan.' },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, it: { subtotal: number }) => sum + (it.subtotal || 0),
      0
    );

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total pembayaran tidak valid.' },
        { status: 400 }
      );
    }

    // Generate readable unique order code, e.g. OZ-260918-724
    const d = new Date();
    const datePart = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderCode = `OZ-${datePart}-${randomSuffix}`;

    const order = await db.order.create({
      data: {
        orderCode,
        customerName,
        division,
        location,
        targetDate: new Date(targetDate),
        notes: notes || '',
        totalAmount,
        paymentMethod,
        status: OrderStatus.PENDING,
        items: {
          create: items.map((it: {
            productId?: string;
            productName: string;
            unitPrice: number;
            quantity: number;
            subtotal: number;
          }) => ({
            productId: it.productId || null,
            productName: it.productName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: unknown) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan pesanan.' },
      { status: 500 }
    );
  }
}
