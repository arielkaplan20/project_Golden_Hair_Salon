// סל הקניות נשמר בדפדפן עד לסיום ההזמנה
export function getCart() {
  const data = localStorage.getItem("cart");
  return data ? JSON.parse(data) : [];
}

export function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// הוספת מוצר לסל. אם הוא כבר בסל, רק מגדילים את הכמות
export function addToCart(product, quantity) {
  const cart = getCart();
  const line = cart.find((c) => c.productId === product._id);
  if (line) {
    line.quantity = line.quantity + quantity;
  } else {
    cart.push({ productId: product._id, name: product.name, price: product.price, quantity });
  }
  saveCart(cart);
}

export function removeFromCart(productId) {
  saveCart(getCart().filter((c) => c.productId !== productId));
}

export function clearCart() {
  localStorage.removeItem("cart");
}

export function cartTotal(cart) {
  return cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
}
