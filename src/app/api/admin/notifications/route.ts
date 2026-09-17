import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    const [pendingCount, latestOrders] = await Promise.all([
      db.order.count({
        where: {
          status: OrderStatus.PENDING,
        },
      }),
      db.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
            },
          },
        },
      }),
    ]);

    const latestOrderId = latestOrders.length > 0 ? latestOrders[0].id : null;
    const latestOrderTime = latestOrders.length > 0 ? latestOrders[0].createdAt : null;

    return NextResponse.json({
      success: true,
      data: {
        pendingCount,
        latestOrderId,
        latestOrderTime,
        orders: latestOrders,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil notifikasi' },
      { status: 500 }
    );
  }
}
