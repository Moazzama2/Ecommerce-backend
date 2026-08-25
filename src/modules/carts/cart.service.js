import ApiError from '../../utils/ApiError.js';
import * as cartRepository from './cart.repository.js';
import * as productRepository from '../products/product.repository.js';

// Get or create cart for user
export const createCart = async (userId) => {
  // Check if cart already exists
  const existingCart = await cartRepository.findByUserId(userId);
  if (existingCart) {
    throw new ApiError(400, 'Cart already exists for this user');
  }
  return cartRepository.create(userId);
};

export const getOrCreateCart = async (userId) => {
  let cart = await cartRepository.findByUserId(userId);
  if (!cart) {
    cart = await cartRepository.create(userId);
  }
  return cart;
};

// Get cart with product details and totals
export const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);

  // Populate product details for each item
  const itemsWithDetails = await Promise.all(
    cart.items.map(async (item) => {
      const product = await productRepository.findById(item.productId);
      return {
        productId: item.productId,
        product: product ? { name: product.name, slug: product.slug } : null,
        quantity: item.quantity,
        price: item.price,
        itemSubtotal: item.price * item.quantity,
      };
    })
  );

  const totalPrice = itemsWithDetails.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const totalProducts = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);

  return {
    userId,
    items: itemsWithDetails,
    totalPrice,
    totalProducts,
    itemCount: itemsWithDetails.length,
  };
};

// Add product to cart
export const addToCart = async (userId, { productId, quantity }) => {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (product.stock < quantity) {
    throw new ApiError(400, 'Insufficient stock');
  }

  const cart = await getOrCreateCart(userId);

  // Check if product already in cart
  const existingItem = cart.items.find((item) => item.productId.toString() === productId);

  if (existingItem) {
    // Update quantity if already in cart
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock < newQuantity) {
      throw new ApiError(400, 'Insufficient stock for requested quantity');
    }
    await cartRepository.updateItemQuantity(userId, productId, newQuantity);
  } else {
    // Add new item to cart
    await cartRepository.addItem(userId, productId, quantity, product.price);
  }

  return getCart(userId);
};

// Update quantity of item in cart
export const updateCartItem = async (userId, productId, { quantity }) => {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (product.stock < quantity) {
    throw new ApiError(400, 'Insufficient stock');
  }

  const cart = await cartRepository.findByUserId(userId);
  if (!cart) throw new ApiError(404, 'Cart not found');

  const itemExists = cart.items.some((item) => item.productId.toString() === productId);
  if (!itemExists) throw new ApiError(404, 'Item not in cart');

  await cartRepository.updateItemQuantity(userId, productId, quantity);
  return getCart(userId);
};

// Remove item from cart
export const removeFromCart = async (userId, productId) => {
  const cart = await cartRepository.findByUserId(userId);
  if (!cart) throw new ApiError(404, 'Cart not found');

  const itemExists = cart.items.some((item) => item.productId.toString() === productId);
  if (!itemExists) throw new ApiError(404, 'Item not in cart');

  await cartRepository.removeItem(userId, productId);
  return getCart(userId);
};

// Clear all items from cart (but keep cart for user)
export const clearCart = async (userId) => {
  const cart = await cartRepository.findByUserId(userId);
  if (!cart) throw new ApiError(404, 'Cart not found');

  await cartRepository.clearCart(userId);
  return { message: 'Cart cleared successfully' };
};