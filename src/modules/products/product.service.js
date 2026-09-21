import ApiError from '../../utils/ApiError.js';
import * as productRepository from './product.repository.js';
import logger from '../../utils/logger.js';

export const getAllProducts = async ({ page = 1, limit = 20, category, search }) => {
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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