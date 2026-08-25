import ApiError from '../../utils/ApiError.js';
import * as categoryRepository from './category.repository.js';
import Product from '../products/product.model.js';
export const createCategory = async (data) => {
  return categoryRepository.create({
    ...data,
    parent: data.parent || null, // empty string → null (top-level)
  });
};

export const getAllCategories = async () => {
  return categoryRepository.findAll();
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

// Walks up the parent chain to build a breadcrumb, e.g. Electronics > Headphones
export const getCategoryBreadcrumb = async (id) => {
  const trail = [];
  let current = await categoryRepository.findById(id);
  if (!current) throw new ApiError(404, 'Category not found');

  while (current) {
    trail.unshift({ id: current._id, name: current.name }); // add to the front
    current = current.parent ? await categoryRepository.findById(current.parent) : null;
  }

  return trail; // e.g. [{ name: 'Electronics' }, { name: 'Headphones' }]
};

export const updateCategory = async (id, updates) => {
  const category = await categoryRepository.updateById(id, updates);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

export const deleteCategory = async (id) => {
  const children = await categoryRepository.findByParent(id);
  if (children.length > 0) {
    throw new ApiError(400, 'Cannot delete a category that has subcategories');
  }
  const category = await categoryRepository.deleteById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return { message: 'Category deleted successfully' };
};
export const getCategoryWithSubcategoriesAndProducts = async (categoryId) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  // Get all direct subcategories
  const subcategories = await categoryRepository.findByParent(categoryId);

  // Get all products in this category
  const products = await Product.find({ category: categoryId })
    .populate({
      path: 'category',
      select: 'name slug'
    });

  return {
    category,
    subcategories,
    products,
    totalProducts: products.length,
    totalSubcategories: subcategories.length,
  };
};