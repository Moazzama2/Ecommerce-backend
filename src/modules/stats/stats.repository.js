import Order from '../orders/order.model.js';
import User from '../users/user.model.js';
import Product from '../products/product.model.js';

// ============================================================
// STATS REPOSITORY — every query behind GET /api/stats/overview.
// Pure aggregations; no business logic lives here (same
// controller → service → repository split as the other modules).
// ============================================================

// Charts bucket by UTC day ($dateToString default), so the window
// must start at UTC midnight too — otherwise points land on the
// wrong day for servers east of Greenwich.
const utcStartOfDay = (daysAgo = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
};

// "Today"/"this month" for the stat cards read better in server-local
// time; only the chart buckets need UTC (see above).
const localStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Headline counters for the stat cards. */
export const findTotals = async () => {
  const [revenueResult, revenueTodayResult, revenueMonthResult, orders, customers, products] =
    await Promise.all([
      // Cancelled orders never counted as revenue.
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: localStartOfDay() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
    ]);

  return {
    revenue: revenueResult[0]?.total ?? 0,
    revenueToday: revenueTodayResult[0]?.total ?? 0,
    revenueMonth: revenueMonthResult[0]?.total ?? 0,
    orders,
    customers,
    products,
  };
};

/** [{ status: 'pending', count: 3 }, ...] — always one row per status. */
export const findOrderStatusCounts = async () => {
  const rows = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const all = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return all.map((status) => ({ status, count: byStatus[status] ?? 0 }));
};

/**
 * One point per day for the charts, oldest first.
 * `field: 'revenue'` sums totalAmount (cancelled excluded upstream),
 * `field: 'orders'` counts documents.
 */
export const findDailySeries = async ({ days = 30, mode = 'revenue' } = {}) => {
  const match = { createdAt: { $gte: utcStartOfDay(days - 1) } };
  if (mode === 'revenue') match.status = { $ne: 'cancelled' };

  const valueStage =
    mode === 'revenue'
      ? { value: { $sum: '$totalAmount' } }
      : { value: { $sum: 1 } };

  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        ...valueStage,
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({ date: r._id, value: r.value }));
};

/** Newest orders for the overview table (customer name/email resolved). */
export const findRecentOrders = (limit = 5) =>
  Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);

/** Best sellers by quantity sold (cancelled orders excluded). */
export const findTopProducts = async (limit = 5) =>
  Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.itemSubtotal' },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: limit },
  ]);
