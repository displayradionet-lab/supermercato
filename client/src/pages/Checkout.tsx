import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  MapPinIcon,
} from 'lucide-react';
import CheckoutAddress from '../components/Checkout/CheckoutAddress';
import CheckoutPayment from '../components/Checkout/CheckoutPayment';
import CheckoutReview from '../components/Checkout/CheckoutReview';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/authContext';

const Checkout = () => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$';

  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState('address');
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    id: '',
    label: 'Casa',
    address: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
    lat: 0,
    lng: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState('card');

  const deliveryFee = cartTotal > 20 ? 0 : 1.99;
  const tax = cartTotal * 0.1;
  const total = cartTotal + deliveryFee + tax;

  const steps: { key: string; label: string; icon: typeof MapPinIcon }[] = [
    { key: 'address', label: 'Address', icon: MapPinIcon },
    { key: 'payment', label: 'Payment', icon: CreditCardIcon },
    { key: 'review', label: 'Review', icon: CheckIcon },
  ];

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      return toast.error('Il carrello è vuoto!');
    }

    setLoading(true);
    try {    
      const totalAmount = items.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + price * item.quantity;
      }, 0);

      // 2. Costruzione del payload con la somma e gli ID corretti
      const orderData = {
        items: items.map((item) => ({
          // Uso dell'operatore || per supportare sia id (MongoDB) che id
          product: item.product?.id || item.product?.id,
          quantity: item.quantity,
          price: item.product?.price || 0, // Spesso il backend vuole salvare il prezzo d'acquisto storico
        })),
        totalAmount: totalAmount, //  Inviamo la somma calcolata al backend!
        shippingAddress: address, // Questo è l'oggetto address popolato dal tuo useState sotto
        paymentMethod: paymentMethod, // Assicurati che questa variabile esista nello stato del componente
      };

      console.log("Dati inviati all'API:", orderData);

      const { data } = await api.post('/orders', orderData);
      console.log('Risposta del server:', data);

      // Gestione reindirizzamento Stripe / PayPal (se presente)
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      clearCart();
      toast.success('Order placed successfully');

      // Sicurezza per l'ID dell'ordine nella navigazione
      const orderId = data.order?.id || data.order?.id || data.id;
      navigate(`/orders/${orderId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Errore durante il place order:', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      scrollTo(0, 0);
    }
  };

  // populate address from user's default address
  useState(() => {
    if (user?.addresses?.length) {
      const defaultAddr =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setAddress({
        id: defaultAddr?.id,
        label: defaultAddr?.label,
        address: defaultAddr?.address,
        city: defaultAddr?.city,
        state: defaultAddr?.state,
        zip: defaultAddr?.zip,
        isDefault: defaultAddr?.isDefault,
        lat: defaultAddr?.lat,
        lng: defaultAddr?.lng,
      });
    }
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-app-cream flex-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-green-600 mb-2">
            Il tuo carrello e` vuoto
          </h2>
          <p className="text-xl text-green-600 mb-4">
            Aggiungi dei prodotti per il pagamento
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-xl 
            hover:bg-app-green-light transition-colors "
          >
            Vai ai prodotti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm to-app-text-light hover:text-app-green 
        mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-2xl font-semibold text-green-600 mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div className="flex items-center gap-2" key={s.key}>
              <button
                onClick={() => setStep(s.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm 
                font-medium transition-colors ${
                  step == s.key
                    ? 'bg-app-green text-white'
                    : 'bg-white text-app-text-light'
                }`}
              >
                <s.icon className="size-4" /> {s.label}
                {i < steps.length - 1 && (
                  <ChevronRightIcon className="size-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* main form */}
          <div className="md:col-span-2">
            {step === 'address' && (
              <CheckoutAddress
                address={address}
                setAddress={setAddress}
                setStep={setStep}
                user={user}
              />
            )}

            {step === 'payment' && (
              <CheckoutPayment
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setStep={setStep}
              />
            )}

            {step === 'review' && (
              <CheckoutReview
                address={address}
                items={items}
                total={total}
                handlePlaceOrder={handlePlaceOrder}
                loading={loading}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-2xl p-5 h-fit sticky top-24 ">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="">SubTotal ({items.length} items)</span>
                <span>
                  {currency} {cartTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-app-text-light">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-app-success">Free</span>
                  ) : (
                    `${currency}${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="">Tax</span>
                <span>
                  {currency} {tax.toFixed(2)}
                </span>
              </div>
              <div
                className="flex justify-between pt-3 border-t border-app-border 
              text-base font-semibold"
              >
                <span>Total</span>
                <span className="text-green-700">
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
