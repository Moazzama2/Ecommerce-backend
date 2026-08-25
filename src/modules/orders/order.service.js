import ApiError from '../../utils/ApiError.js';
import * as orderRepository from './order.repository.js';
import * as cartService from '../carts/cart.service.js';
import * as productRepository from '../products/product.repository.js';

// Place order with addresses
export const placeOrder = async (userId, { shippingAddress, billingAddress }) => {
  // Get user's cart
  const cart = await cartService.getCart(userId);
  if (!cart.items.length) throw new ApiError(400, 'Cart is empty');

  // Validate stock for all items
  for (const item of cart.items) {
    const product = await productRepository.findById(item.productId);
    if (!product) throw new ApiError(404, `Product not found`);
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }
  }

  // Create order with cart items and addresses
  const order = await orderRepository.create({
    userId,
    items: cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product?.name,
      quantity: item.quantity,
      price: item.price,
      itemSubtotal: item.itemSubtotal,
    })),
    totalAmount: cart.totalPrice,
    totalProducts: cart.totalProducts,
    shippingAddress,
    billingAddress,
    status: 'pending',
    paymentStatus: 'unpaid',
  });

  // Deduct stock from products
  for (const item of cart.items) {
    await productRepository.updateById(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  // Clear user's cart
  await cartService.clearCart(userId);

  return order;
};

// Get all orders for user
export const getUserOrders = async (userId) => {
  return orderRepository.findByUserId(userId);
};

// Get single order (verify user owns it)
export const getOrderById = async (orderId, userId) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.userId.toString() !== userId) {
    throw new ApiError(403, 'Cannot view others orders');
  }

  return order;
};

// Admin: update order status
export const updateOrderStatus = async (orderId, newStatus) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  // Define allowed status transitions
  const allowedTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!allowedTransitions[order.status].includes(newStatus)) {
    throw new ApiError(400, `Cannot change from ${order.status} to ${newStatus}`);
  }

  return orderRepository.updateStatus(orderId, newStatus);
};

// Cancel order (restore stock)
export const cancelOrder = async (orderId, userId) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.userId.toString() !== userId) {
    throw new ApiError(403, 'Cannot cancel others orders');
  }

  // Can only cancel if pending or processing
  if (!['pending', 'processing'].includes(order.status)) {
    throw new ApiError(400, `Cannot cancel ${order.status} order`);
  }

  // Restore stock
  for (const item of order.items) {
    await productRepository.updateById(item.productId, {
      $inc: { stock: +item.quantity },
    });
  }

  return orderRepository.cancel(orderId);
};
// Admin: Get all orders with filtering and sorting
export const getAllOrders = async ({ page = 1, limit = 20, sortBy = 'newest', productId }) => {
  const filter = {};

  // Filter by product if provided
  if (productId) {
    filter['items.productId'] = productId;
  }

  // Determine sort direction
  const sort = sortBy === 'newest' ? '-createdAt' : 'createdAt';

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    orderRepository.findAllWithFilter({ filter, skip, limit, sort }),
    orderRepository.countAll(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};