import { useEffect, useState } from "react"
import type { Product } from "../types"
import { Link, useSearchParams } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";
import { Home, Search } from "lucide-react";
import Loading from "../components/Loading";
import ProductCard from "../components/ProductCard";

const SearchResults = () => {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") || searchParams.get("search") || "";
  const category = searchParams.get('category') || '';

  useEffect(() => {
    if (!query && !category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (category) params.set('category', category);

    api.get(`/products?${params.toString()}`)
      .then((res) => {
        // Usiamo un ripiego nel caso in cui la proprietà 'products' non esista
        setProducts(res.data.products || []);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((error: any) => {
        toast.error(error.response?.data?.message || error?.message);
        setProducts([]); // Svuota i prodotti in caso di errore per evitare crash
      })
      .finally(() => setLoading(false));

  }, [query, category]); 
   
  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link to={'/'} className="hover:text-app-green transition-colors">
            <Home className="size-4" />
          </Link>
          <span>/</span>
          <span className="text-app-green font-medium">
            search results
          </span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-green-600">Results for "{query || category}"</h1>
          <p className="text-sm text-app-text-light">
            {loading ? "Searching..." : `${(products || []).length} items found`}
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <Loading />
        ) : (products || []).length === 0 ? (
          <div className="text-center py-20">
            <Search className="size-16 text-app-border mx-auto mb-4"/>
            <h2 className="text-xl font-semibold text-app-green mb-2">No results found</h2>
            <p className="text-sm text-app-text-light mb-6 max-w-md mx-auto">
              We couldn't find any products matching "{query || category}". 
            </p>
            <Link to={'/products'} className="inline-flex px-5 py-2.5 bg-app-green text-white
             text-sm font-medium rounded-lg">
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              // 🟢 Sicurezza per il warning della key: se product._id manca, usa l'id o l'index
              <ProductCard key={product.id || index} product={product}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults;