import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('targetDate'); // optional filter by targetDate

    // 1. All Orders for metrics
    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { targetDate: 'desc' },
    });

    // 2. Kitchen Portion Summary for targetDate (or all if not specified)
    const filteredOrders = targetDate
      ? orders.filter(
          (o) =>
            new Date(o.targetDate).toISOString().split('T')[0] === targetDate
        )
      : orders;

    const kitchenPortions: Record<string, { quantity: number; revenue: number }> = {};

    filteredOrders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        o.items.forEach((it) => {
          if (!kitchenPortions[it.productName]) {
            kitchenPortions[it.productName] = { quantity: 0, revenue: 0 };
          }
          kitchenPortions[it.productName].quantity += it.quantity;
          kitchenPortions[it.productName].revenue += it.subtotal;
        });
      }
    });

    // 3. Overall KPI Stats
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrdersCount = validOrders.length;

    // 4. Grouping by Target Date (Daily/Weekly delivery)
    const ordersByTargetDate: Record<
      string,
      { count: number; revenue: number; itemsCount: number }
    > = {};

    validOrders.forEach((o) => {
      const dateKey = new Date(o.targetDate).toISOString().split('T')[0];
      if (!ordersByTargetDate[dateKey]) {
        ordersByTargetDate[dateKey] = { count: 0, revenue: 0, itemsCount: 0 };
      }
      ordersByTargetDate[dateKey].count += 1;
      ordersByTargetDate[dateKey].revenue += o.totalAmount;
      ordersByTargetDate[dateKey].itemsCount += o.items.reduce(
        (acc, curr) => acc + curr.quantity,
        0
      );
    });

    // 5. Grouping by Month
    const ordersByMonth: Record<string, { count: number; revenue: number }> = {};
    validOrders.forEach((o) => {
      const d = new Date(o.targetDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = { count: 0, revenue: 0 };
      }
      ordersByMonth[monthKey].count += 1;
      ordersByMonth[monthKey].revenue += o.totalAmount;
    });

    // 6. Division breakdown
    const divisionStats: Record<string, number> = {};
    validOrders.forEach((o) => {
      divisionStats[o.division] = (divisionStats[o.division] || 0) + 1;
    });

    // 7. Location breakdown
    const locationStats: Record<string, number> = {};
    validOrders.forEach((o) => {
      locationStats[o.location] = (locationStats[o.location] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrdersCount,
          filteredOrdersCount: filteredOrders.length,
          filteredRevenue: filteredOrders
            .filter((o) => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + o.totalAmount, 0),
        },
        kitchenPortions: Object.entries(kitchenPortions).map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue,
        })),
        ordersByTargetDate: Object.entries(ordersByTargetDate).map(
          ([date, stats]) => ({
            date,
            ...stats,
          })
        ),
        ordersByMonth: Object.entries(ordersByMonth).map(([month, stats]) => ({
          month,
          ...stats,
        })),
        divisionStats: Object.entries(divisionStats).map(([name, count]) => ({
          name,
          count,
        })),
        locationStats: Object.entries(locationStats).map(([name, count]) => ({
          name,
          count,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses data laporan' },
      { status: 500 }
    );
  }
}
