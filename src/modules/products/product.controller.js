import asyncHandler from '../../utils/asyncHandler.js';
import * as productService from './product.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const { page, limit, category, search } = req.query;
  const result = await productService.getAllProducts({ page, limit, category, search });
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.params.name);
  res.status(200).json({ success: true, data: product });
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.id);
  res.status(201).json({ success: true, data: product });
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.status(200).json({ success: true, data: result });
});