import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Optional because web clients renew via the httpOnly cookie only.
export const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
}).min(1);

// ---------- Admin (dashboard) ----------

export const adminListUsersSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  search: Joi.string().allow('').max(100).optional(),
});

export const adminRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin').required(),
});

export const adminStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});