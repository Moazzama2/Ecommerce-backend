import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './modules/users/user.routes.js';
import productRoutes from './modules/products/product.route.js';
import errorMiddleware from './middlewares/error.middleware.js';
import categoryRoutes from './modules/category/category.routes.js';
import cartRoutes from './modules/carts/cart.routes.js';
import orderRoutes from './modules/orders/order.routes.js';



const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorMiddleware); // must be last

export default app;