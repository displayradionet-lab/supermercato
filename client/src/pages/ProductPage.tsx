import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Product } from '../types';

import Loading from '../components/Loading';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, LeafIcon, MinusIcon, PlusIcon, ShoppingCartIcon, StarIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import DummyReviewsSection from '../assets/DummyReviewsSection';
import ProductCard from '../components/ProductCard';
import api from '../config/api';

const ProductPage = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '';
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQuantity, setLocalQuantity] = useState(1);

  useEffect(() => {  
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLocalQuantity(1);
    window.scrollTo(0, 0);   
   api.get(`/products/${id}`).then(({data}) => {
    setProduct(data.product);
    return api.get(`/products?category=${data.product.category}`)
   }).then(({data})=>{
    setRelatedProducts(data.products.filter((p: Product) => p.id !== id))
   }).catch(()=>navigate("/products")).finally(()=> setLoading(false))
  }, [id, navigate]);

  if (loading) return <Loading />;
  if (!product) return null;

  const cartItem = items.find((item) => item.product.id === product.id);
  const inCart = !!cartItem;
  const displayQuantity = inCart ? cartItem.quantity : localQuantity;

  const categoryLabel = product.category.replace(/-/g, ' ');

  const handleMinus = () => {
    if (inCart){
      if (cartItem.quantity > 1) updateQuantity(product.id, cartItem.quantity - 1)
        else removeFromCart(product.id)
    } else {
      setLocalQuantity(Math.max(1, localQuantity -1))
    }
  }

   const handlePlus = () => {
    if (inCart) updateQuantity(product.id, cartItem.quantity +1)
      else setLocalQuantity(localQuantity +1)
    
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto items-center gap-2 text-sm text-app-text-light mb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-app-text-light">
          <Link className="hover:text-app-green transition-colors" to={'/'}>
            <HomeIcon className="size-4" />
          </Link>
          <span>/</span>
          <Link
            to={'/products'}
            className="hover:text-app-green transition-colors"
          >
            Products
          </Link>
          <span>/</span>
          <Link
            to={'/products?category=${product.category}'}
            className="hover:text-app-green transition-colors capitalize"
          >
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-green-900 font-medium truncate max-w-50">
            {product.name}
          </span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="p-4 flex items-center gap-1.5 text-sm text-app-text-light hover:text-green-900 transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          back
        </button>

        {/* Product Details Section */}
        <div className="bg-white/50 rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* left side */}
            <div className="relative flex-center p-8 md:p-12 min-h-80 md:min-h-120">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-90 w-auto object-contain"
              />
              <div className="absolute top-5 left-5 flex flex-wrap gap-1.5">
                {product.isOrganic && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-green-900 text-white">
                    <LeafIcon className="w-3 h-3" />
                    Organic
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-orange-600 text-white rounded-full">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>
            {/* Badge */}

            {/* right side details */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <span 
              className='text-xs font-medium text-app-text-light tracking-wider mb-2 capitalize'
              >{categoryLabel}</span>
              <h1 className='text-2xl md:text-3xl font-semibold text-green-700 mb-3'>{product.name}</h1>

              {/* rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className='flex items-center gap-0.5'>
                    {[1,2,3,4,5].map((star)=> (
                      <StarIcon key={star} className={`w-4 h-4 ${
                        star <= Math.round(product.rating)
                        ? "text-app-warning fill-app-warning" 
                        : "text-app-border"
                      }`}/>
                    ))}
                  </div>
                  <span className='font-medium text-sm'>{product.rating}</span>
                  <span className='text-sm text-app-text-light'>({product.reviewCount} Reviews)</span>
                </div>
              )}

              {/* price */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl md:text-4xl font-semibold text-green-600">{currency} {product.price.toFixed(2)}</span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-green-700 line-through">{currency} {product.originalPrice.toFixed(2)}</span>
                )}
              </div>

              {/* description */}
              <p className="text-sm text-app-text-light leading-relaxed mb-6">{product.description}</p>

              {/* Stock */}
              <div className="mb-6">
              {product.stock > 0 ? (
                <span className="text-sm text-app-success font-medium"
                >✓ In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-sm bg-app-error font-medium">Out of stock</span>
              )}
              </div>

            {/* quantity + Add to Cart */}
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-app-border rounded-xl overflow-hidden">
                <button onClick={handleMinus} 
                className='p-3 hover:bg-app-cream transition-colors'>
                  <MinusIcon className='w-4 h-4'/>
                </button>
                <span>{displayQuantity}</span>
                <button onClick={handlePlus}  
                className='p-3 hover:bg-app-cream transition-colors'>
                  <PlusIcon className='w-4 h-4'/>
                  </button>                  
                  </div>
                {/* Add to cart */}
                <button disabled={product.stock === 0} 
                onClick={()=>{if(!inCart) addToCart(product, localQuantity)}}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex-center gap-2 
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                    inCart ? "bg-app-cream text-green-700 border border-green-800" 
                    : "bg-orange-500 text-white hover:bg-orange-700"
                  }`}>
                  <ShoppingCartIcon className='w-4 h-4'/>
                  {inCart ? "Added to Cart" : "Add to Cart"}
                </button>
            </div>
                  </div>
          </div>
        </div>
      </div>
        {/* Customers Reviews */}
       {product.reviewCount > 0 && <DummyReviewsSection product={product}/>}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className='mt-12 mb-44 px-6'>
            <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-app-green">Related Products</h2>
              <p className='text-sm mt-1 text-app-text-light'>More from {categoryLabel}</p>
            </div>
            <Link to={`/products?category=${product.category}`}
            className='text-sm font-semibold text-app-orange hover:text-app-orange-dark 
            flex items-center gap-1 transform-colors'>
            View All <ArrowRightIcon className='size-4'/>
            </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
            {relatedProducts.slice(0,5).map((rp) => (
              <ProductCard key={rp.id} product={rp}/>
            ))}
            </div>
          </section>
        )}
    </div>
  );
};

export default ProductPage;
