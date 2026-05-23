import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product } from '../types';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      return { success: false, error: `${product.name} is out of stock.` };
    }

    let error: string | undefined;
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      const currentQty = existing ? existing.quantity : 0;
      const requestedTotal = currentQty + quantity;

      if (requestedTotal > product.stock) {
        error = `Cannot add ${quantity} of ${product.name}. Total would exceed stock (${product.stock}).`;
        return prev;
      }
      
      if (!existing) return [...prev, { product, quantity }];
      
      return prev.map((item) => 
        item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
      );
    });

    if (error) return { success: false, error };
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id !== productId) return item;
        return { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stock)) };
      }).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const subTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
