import mongoose from 'mongoose';
import ApiError from '../../utils/ApiError.js';
import * as productRepository from './product.repository.js';
import logger from '../../utils/logger.js';
import Category from '../category/category.model.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllProducts = async ({ page = 1, limit = 20, category, search }) => {
  const filter = {};

  // Category filter — accepts a category ObjectId, name, or slug (case-insensitive)
  if (category) {
    const orClauses = [
      { name: new RegExp(escapeRegex(String(category)), 'i') },
      { slug: new RegExp(escapeRegex(String(category)), 'i') },
    ];
    if (mongoose.Types.ObjectId.isValid(String(category))) {
      orClauses.unshift({ _id: String(category) });
    }

    const matches = await Category.find({ $or: orClauses }).select('_id');

    if (matches.length === 0) {
      filter._id = null; // no matching category -> force an empty result
    } else {
      // Include descendant categories so tapping a parent category also shows
      // the products of its subcategories (and their subcategories, if any).
      const ids = new Set(matches.map((m) => m._id.toString()));
      let grew = true;
      while (grew) {
        const children = await Category.find({
          parent: { $in: [...ids] },
        }).select('_id');
        grew = false;
        for (const child of children) {
          if (!ids.has(child._id.toString())) {
            ids.add(child._id.toString());
            grew = true;
          }
        }
      }

      filter.category = { $in: [...ids] };
    }
  }

  if (search) {
    const regex = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ name: regex }, { description: regex }];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    productRepository.findAll({ filter, skip, limit }),
    productRepository.countAll(filter),
  ]);

  return {
    products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const getProductById = async (id,name) => {
    logger.debug('getProductById called', { id, name });
  const product = await productRepository.findById(id) || await productRepository.findAll({filter: {name}});
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

export const createProduct = async (data, adminId) => {
  return productRepository.create({ ...data, createdBy: adminId });
};

export const updateProduct = async (id, updates) => {
  const product = await productRepository.updateById(id, updates);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

export const deleteProduct = async (id) => {
  const product = await productRepository.deleteById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return { message: 'Product deleted successfully' };
};