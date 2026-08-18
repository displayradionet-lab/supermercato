/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import ProductCard from '../ProductCard';
import api from '../../config/api';
import toast from 'react-hot-toast';

const PopularProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {   
    api
      .get('/products')
      .then((res) => {
        console.log('RISPOSTA COMPLETA BACKEND:', res.data);

        // Estraiamo l'array prodotti considerando tutte le strutture possibili
        let list: any[] = [];

        if (res.data && Array.isArray(res.data.products)) {
          list = res.data.products; // <-- Struttura reale del tuo backend { products: [...] }
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }

        // Ordiniamo per rating se necessario
        const sorted = [...list].sort(
          (a, b) => (b.rating || 0) - (a.rating || 0),
        );

        setProducts(sorted);
      })
      .catch((error: any) => {
        console.error('Errore durante il caricamento:', error);
        toast.error(error?.response?.data?.message || error?.message);
      });
  }, []);

  return (
    <section className="pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="">
            <h2 className="text-2xl font-semibold">Prodotti Popolari</h2>
            <p className="text-sm text-app-text-light mt-1">
              Prodotti Top Scelti
            </p>
          </div>
          <Link
            to={'/products'}
            className="text-sm font-semibold text-app-orange hover:text-app-orange-dark flex items-center 
                gap-1 transition-colors"
          >
            Vedili Tutti <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
          {products.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
