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
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
  // Order id or customer name/email (the dashboard's search box).
  search: Joi.string().allow('').max(100).optional(),
  // Restrict to a customer — used by the customer detail screen.
  userId: Joi.string().length(24).hex().optional(),
  // Placed-on date window, 'YYYY-MM-DD', both days inclusive.
  from: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required(),
});