import asyncHandler from '../../utils/asyncHandler.js';
import * as cartService from './cart.service.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.status(200).json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user.id, req.body);
  res.status(200).json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(req.user.id, req.params.productId, req.body);
  res.status(200).json({ success: true, data: cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await cartService.removeFromCart(req.user.id, req.params.productId);
  res.status(200).json({ success: true, data: cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const result = await cartService.clearCart(req.user.id);
  res.status(200).json({ success: true, data: result });
});