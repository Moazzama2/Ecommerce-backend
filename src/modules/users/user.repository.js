import User from './user.model.js';

export const findByEmail = (email) => User.findOne({ email });
export const findById = (id) => User.findById(id);
export const create = (data) => User.create(data);
export const updatePassword = (id, hashedPassword) =>
  User.findByIdAndUpdate(id, { password: hashedPassword, refreshToken: null }, { new: true });
export const updateRefreshToken = (id, refreshToken) =>
  User.findByIdAndUpdate(id, { refreshToken }, { new: true });
export const updateUser = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

export const deleteUser = (id) => User.findByIdAndDelete(id);