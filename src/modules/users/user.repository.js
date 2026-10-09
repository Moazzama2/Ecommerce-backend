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

// ---------- Admin (dashboard) ----------

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Paginated user list with optional case-insensitive search on name/email.
export const findAllWithFilter = ({ filter = {}, skip = 0, limit = 20 }) =>
  User.find(filter)
    .select('-refreshToken') // never ship tokens to the client
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

export const countAll = (filter = {}) => User.countDocuments(filter);

export const setSearchFilter = (search) => {
  if (!search) return {};
  const regex = new RegExp(escapeRegex(String(search)), 'i');
  return { $or: [{ name: regex }, { email: regex }] };
};

// Ids behind a name/email search — lets the orders list resolve
// "search by customer" without an aggregation ($lookup) pipeline.
export const findIdsBySearch = async (search, limit = 500) => {
  if (!search) return [];
  const docs = await User.find(setSearchFilter(search)).select('_id').limit(limit);
  return docs.map((doc) => doc._id);
};

export const setRole = (id, role) =>
  User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });

// Disabling also revokes the refresh token so the session cannot renew.
export const setActive = (id, isActive) =>
  User.findByIdAndUpdate(
    id,
    { isActive, ...(isActive ? {} : { refreshToken: null }) },
    { new: true, runValidators: true },
  );

export const clearRefreshToken = (id, refreshToken) =>
  User.findOneAndUpdate(
    { _id: id, refreshToken },
    { refreshToken: null },
    { new: true },
  );

export const findAllIds = async () => {
  const docs = await User.find({ isActive: true }).select('_id').lean();
  return docs.map((doc) => doc._id);
};