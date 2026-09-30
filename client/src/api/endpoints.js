import client, { getSessionId } from "./client.js";

/* ---------------------------------- products --------------------------------- */

export const fetchProducts = (params = {}) =>
  client.get("/products", { params }).then((r) => r.data);

export const fetchProductFilters = () =>
  client.get("/products/filters").then((r) => r.data);

export const fetchProduct = (slug) => client.get(`/products/${slug}`).then((r) => r.data);

export const createProduct = (payload) => client.post("/products", payload).then((r) => r.data);

export const updateProduct = (id, payload) =>
  client.put(`/products/${id}`, payload).then((r) => r.data);

export const deleteProduct = (id) => client.delete(`/products/${id}`).then((r) => r.data);

/* ----------------------------------- auth ----------------------------------- */

export const register = (payload) =>
  client
    .post("/auth/register", { ...payload, sessionId: getSessionId() })
    .then((r) => r.data);

export const login = (payload) =>
  client
    .post("/auth/login", { ...payload, sessionId: getSessionId() })
    .then((r) => r.data);

export const fetchMe = () => client.get("/auth/me").then((r) => r.data);

export const logout = () => client.post("/auth/logout").then((r) => r.data);

export const updateProfile = (payload) => client.put("/auth/me", payload).then((r) => r.data);

/* ----------------------------------- cart ----------------------------------- */

export const fetchCart = () => client.get("/cart").then((r) => r.data);

export const addToCart = ({ productId, variantId = null, qty = 1 }) =>
  client.post("/cart", { productId, variantId, qty, sessionId: getSessionId() }).then((r) => r.data);

export const updateCartItem = (itemId, qty) =>
  client.put(`/cart/${itemId}`, { qty }).then((r) => r.data);

export const removeCartItem = (itemId) =>
  client.delete(`/cart/${itemId}`).then((r) => r.data);

export const clearCart = () => client.delete("/cart").then((r) => r.data);

/* --------------------------------- wishlist --------------------------------- */

export const fetchWishlist = () => client.get("/wishlist").then((r) => r.data);

export const addToWishlist = (productId) =>
  client.post(`/wishlist/${productId}`).then((r) => r.data);

export const removeFromWishlist = (productId) =>
  client.delete(`/wishlist/${productId}`).then((r) => r.data);

/* ---------------------------------- orders ---------------------------------- */

export const createOrder = (payload) =>
  client.post("/orders", { ...payload, sessionId: getSessionId() }).then((r) => r.data);

export const fetchOrder = (idOrNumber) => client.get(`/orders/${idOrNumber}`).then((r) => r.data);

export const fetchMyOrders = () => client.get("/orders").then((r) => r.data);

export const fetchAllOrders = (params = {}) =>
  client.get("/orders/all", { params }).then((r) => r.data);

export const updateOrderStatus = (id, paymentStatus) =>
  client.put(`/orders/${id}/payment-status`, { paymentStatus }).then((r) => r.data);

/* ---------------------------------- contact --------------------------------- */

export const submitContact = (payload) => client.post("/contact", payload).then((r) => r.data);

export const fetchContactMessages = () => client.get("/contact").then((r) => r.data);
