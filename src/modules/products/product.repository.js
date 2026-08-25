import Product from './product.model.js';

// export const findAll = ({ filter = {}, skip = 0, limit = 20, sort = '-createdAt' }) => {
//   return Product.find(filter).sort(sort).skip(skip).limit(limit);
// };

export const countAll = (filter = {}) => Product.countDocuments(filter);

// export const findById = (id) => Product.findById(id);

export const create = (data) => Product.create(data);

export const updateById = (id, updates) =>
  Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

export const deleteById = (id) => Product.findByIdAndDelete(id);
export const findAll = ({ filter = {}, skip = 0, limit = 20, sort = '-createdAt' }) => {
  return Product.find(filter)
    .populate({
      path: 'category',
      select: 'name slug parent',
      populate: {
        path: 'parent',
        select: 'name slug'
      }
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

export const findById = (id) =>
  Product.findById(id)
    .populate({
      path: 'category',
      select: 'name slug parent',
      populate: {
        path: 'parent',
        select: 'name slug'
      }
    });

// export const findById = (id) => Product.findById(id).populate('category', 'name slug');