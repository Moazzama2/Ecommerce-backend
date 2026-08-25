import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string().min(2).max(50).required(),
  parent: Joi.string().allow(null, '').optional(), // category ID, or empty for top-level
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  slug: Joi.string().min(2).max(50),
  parent: Joi.string().allow(null, ''),
}).min(1);