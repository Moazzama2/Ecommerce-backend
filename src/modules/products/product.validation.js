import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  stock: Joi.number().min(0).required(),
  // Image URLs (no upload endpoint yet — the dashboard pastes links).
  images: Joi.array().items(Joi.string().uri({ scheme: ['http', 'https'] })).max(10).optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().min(10),
  price: Joi.number().min(0),
  category: Joi.string(),
  stock: Joi.number().min(0),
  images: Joi.array().items(Joi.string().uri({ scheme: ['http', 'https'] })).max(10),
}).min(1);