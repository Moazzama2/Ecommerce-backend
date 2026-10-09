import Joi from 'joi';

export const adminListQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
});

export const broadcastSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  body: Joi.string().min(3).max(500).required(),
  // Who receives the announcement:
  //   active_accounts → every enabled account (feed + socket + push)
  //   devices         → every account with the app installed on a device
  audience: Joi.string().valid('active_accounts', 'devices').default('active_accounts'),
});
