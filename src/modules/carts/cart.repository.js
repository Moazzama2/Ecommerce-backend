import Cart from './cart.models.js';

export const findByUserId = (userId) => Cart.findOne({ userId });

export const create = (userId) => Cart.create({ userId, items: [] });

export const addItem = (userId, productId, quantity, price) =>
  Cart.findOneAndUpdate(
    { userId },
    { $push: { items: { productId, quantity, price } } },
    { new: true }
  );

export const updateItemQuantity = (userId, productId, quantity) =>
  Cart.findOneAndUpdate(
    { userId, 'items.productId': productId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true }
  );

export const removeItem = (userId, productId) =>
  Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { productId } } },
    { new: true }
  );

export const clearCart = (userId) =>
  Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [] } },
    { new: true }
  );