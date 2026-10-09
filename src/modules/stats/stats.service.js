import * as statsRepository from './stats.repository.js';

// ============================================================
// STATS SERVICE — assembles the payload behind the dashboard's
// overview screen. Charts receive a dense series (gaps filled with
// zeros) so the client never has to do date maths.
// ============================================================

/** [{date, value}, ...] for every one of the last `days` UTC days. */
const fillSeries = (rows, days) => {
  const byDate = Object.fromEntries(rows.map((r) => [r.date, r.value]));
  const out = [];
  const DAY = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    // UTC key, matching the server's UTC bucketing.
    const key = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    out.push({ date: key, value: byDate[key] ?? 0 });
  }
  return out;
};

export const getOverview = async ({ days = 30 } = {}) => {
  const range = Math.min(Math.max(Number(days) || 30, 7), 90);

  const [
    totals,
    orderStatusCounts,
    revenueRows,
    ordersRows,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    statsRepository.findTotals(),
    statsRepository.findOrderStatusCounts(),
    statsRepository.findDailySeries({ days: range, mode: 'revenue' }),
    statsRepository.findDailySeries({ days: range, mode: 'orders' }),
    statsRepository.findRecentOrders(5),
    statsRepository.findTopProducts(5),
  ]);

  const revenueSeries = fillSeries(revenueRows, range);
  const ordersSeries = fillSeries(ordersRows, range);

  return {
    totals,
    orderStatusCounts,
    // One dense point per day across the requested window; the client
    // slices this down when a chart is set to a shorter range.
    charts: {
      revenue: revenueSeries,
      orders: ordersSeries,
      rangeDays: range,
      requestedRange: range,
    },
    recentOrders,
    topProducts,
  };
};
