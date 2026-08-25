import Order from './order.model.js';

export const create = (data) => Order.create(data);

export const findByUserId = (userId) => Order.find({ userId }).sort({ createdAt: -1 });

export const findById = (id) => Order.findById(id).populate('items.productId', 'name slug');

export const updateStatus = (id, status) =>
  Order.findByIdAndUpdate(id, { status }, { new: true });
export const findAllWithFilter = ({ filter = {}, skip = 0, limit = 20, sort = '-createdAt' }) => {
  return Order.find(filter)
    .populate('userId', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

export const countAll = (filter = {}) => Order.countDocuments(filter);
export const cancel = (id) => Order.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });