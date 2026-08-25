import Joi from 'joi';

const addressSchema = Joi.object({
  fullName: Joi.string().min(3).required(),
  phone: Joi.string().min(10).required(),
  address: Joi.string().min(5).required(),
  city: Joi.string().required(),
  zipCode: Joi.string().required(),
});

export const placeOrderSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.required(),
});
export const getAllOrdersQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).default(20),
  sortBy: Joi.string().valid('newest', 'oldest').default('newest'),
  productId: Joi.string().length(24).hex(), // Optional product filter
});
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required(),
});