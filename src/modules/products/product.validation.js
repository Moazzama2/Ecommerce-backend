import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  // New products need a substantial description (200–2000 characters).
  description: Joi.string().min(200).max(2000).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  stock: Joi.number().min(0).required(),
  // Image URLs — either pasted by hand or returned by POST /api/uploads/image.
  images: Joi.array().items(Joi.string().uri({ scheme: ['http', 'https'] })).max(10).optional(),
});

export const updateProductSchema = Joi.object({
  // The dashboard sends the document id inside the body — the /update route
  // has no :id segment. The controller pulls it out before applying updates.
  _id: Joi.string().required(),
  name: Joi.string().min(2).max(100),
  // No minimum here: products created before the 200-character rule still
  // have to be editable. The 2000-character ceiling applies everywhere.
  // (Joi.string() rejects '' by default, so this stays non-empty.)
  description: Joi.string().max(2000),
  price: Joi.number().min(0),
  category: Joi.string(),
  stock: Joi.number().min(0),
  images: Joi.array().items(Joi.string().uri({ scheme: ['http', 'https'] })).max(10),
}).min(1);