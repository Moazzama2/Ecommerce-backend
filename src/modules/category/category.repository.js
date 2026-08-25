import Category from './category.model.js';

export const create = (data) => Category.create(data);
export const findAll = () => Category.find().sort('name');
export const findById = (id) => Category.findById(id);
export const findByParent = (parentId) => Category.find({ parent: parentId });
export const updateById = (id, updates) =>
  Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
export const deleteById = (id) => Category.findByIdAndDelete(id);