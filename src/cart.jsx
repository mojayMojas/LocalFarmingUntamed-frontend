import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

/** Customer shopping cart: lines of { inventoryId, productName, unit, unitPrice, maxQuantity, quantity }. */
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);

  const setQuantity = useCallback((item, quantity) => {
    setLines((prev) => {
      const rest = prev.filter((l) => l.inventoryId !== item.inventoryId);
      const q = Number(quantity);
      if (!q || q <= 0) return rest;
      return [
        ...rest,
        {
          inventoryId: item.inventoryId,
          productName: item.productName,
          unit: item.unit,
          unitPrice: item.sellingPrice,
          maxQuantity: item.availableQuantity,
          quantity: Math.min(q, item.availableQuantity),
        },
      ].sort((a, b) => a.inventoryId - b.inventoryId);
    });
  }, []);

  const remove = useCallback((inventoryId) => setLines((p) => p.filter((l) => l.inventoryId !== inventoryId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      setQuantity,
      remove,
      clear,
      total: lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
      count: lines.length,
    }),
    [lines, setQuantity, remove, clear]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
