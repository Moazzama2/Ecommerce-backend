import Joi from 'joi';

export const addToCartSchema = Joi.object({
  productId: Joi.string().length(24).hex().required(),
  quantity: Joi.number().min(1).required(),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().min(1).required(),
});