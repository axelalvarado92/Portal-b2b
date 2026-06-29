import { createContext, useContext, useState, useEffect } from "react";
import { getAllCarts } from "../services/cartService";

const CartContext = createContext();

export function CartProvider({ children }) {

  const [cartCount, setCartCount] = useState(0);

  const [cartTotal, setCartTotal] = useState(0);

  async function refreshCart() {

    try {
  
      const response = await getAllCarts();
  
      const carts = response.data.carts || [];
  
      let totalItems = 0;

        carts.forEach(cart => {
        
          cart.items.forEach(item => {
        
            totalItems += Number(item.quantity || 0);
        
          });
        
        });
  
      setCartCount(totalItems);
  
      setCartTotal(response.data.grand_total || 0);
  
    } catch (err) {
  
      console.error(err);
  
    }
  
  }

  useEffect(() => {

    refreshCart();

  }, []);

  return (

    <CartContext.Provider
      value={{
        cartCount,
        cartTotal,
        refreshCart
      }}
    >

      {children}

    </CartContext.Provider>

  );

}

export function useCart() {

  return useContext(CartContext);

}