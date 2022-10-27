import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import {toast} from "react-toastify";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if(productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
      window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const productIndex = newCart.findIndex(p => p.id === productId)

      if(productIndex > -1) {
        newCart.splice(productIndex, 1)
        setCart(newCart)
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if ( amount <= 0 ) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(amount > stockAmount) {
        console.log('entered on validation')
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const newCart = [...cart]
      const productExists = newCart.find(p => p.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(newCart)
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
