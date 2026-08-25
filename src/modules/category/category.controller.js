import asyncHandler from '../../utils/asyncHandler.js';
import * as categoryService from './category.service.js';

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

export const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json({ success: true, data: categories });
});

export const getById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(200).json({ success: true, data: category });
});

export const getBreadcrumb = asyncHandler(async (req, res) => {
  const trail = await categoryService.getCategoryBreadcrumb(req.params.id);
  res.status(200).json({ success: true, data: trail });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json({ success: true, data: category });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.status(200).json({ success: true, data: result });
});
export const getCategoryWithDetails = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategoryWithSubcategoriesAndProducts(req.params.id);
  res.status(200).json({ success: true, data: result });
});