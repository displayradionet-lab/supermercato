import { useState } from 'react';
import { heroSectionData } from '../assets/assets';
import { Link } from 'react-router-dom';
import {  
  Loader2Icon,
  LockIcon,
  MailIcon,
  UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/authContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLoginState, setIsLoginState] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginState) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center
        justify-center"
      >
        <img
          src={heroSectionData.hero_image}
          alt=""
          className="absolute inset-0 
            object-cover h-full bg-center opacity-10"
        />

        <div className="relative text-center px-12">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Benvenuti al SuperMercato{' '}
          </h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Prodotti sempre freschi e produzione organica, ogni giorno da noi
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex-center px-4 py-12 bg-app-cream">
        <div className="w-full max-w-md">
          {/* form header msg */}
          <div className="text-center mb-8">
            <Link to={'/'} className="inline-flex items-center gap-2 mb-6">
              🎯
              <span className="text-2xl font-semibold text-app-green">
                SuperMercato
              </span>
            </Link>
            <h1 className="text-2xl font-semibold text-app-green mb-2">
              {isLoginState ? 'Digita il tuo account' : 'Iscriviti'}
            </h1>
            <p className="text-sm text-app-text-light">
              {isLoginState ? 'Non hai un account?' : 'Hai gia un account?'}
              <button
                onClick={() => setIsLoginState(!isLoginState)}
                className="text-green-500 ml-1 font-semibold hover:text-green-600 transition-colors"
              >
                {isLoginState ? 'Creane uno' : 'Entra'}
              </button>
            </p>
          </div>
          {/* login register form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginState && (
              <label className="text-sm flex flex-col gap-1">
                Name
                <div className="relative">
                  <UserIcon
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 
                                text-app-text-light"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Scrivi il tuo nome"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border 
                    not-focus:border-app-border transition-all"
                  />
                </div>
              </label>
            )}
            <label className="text-sm flex flex-col gap-1">
              Email Address
              <div className="relative">
                <MailIcon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 
                                text-app-text-light"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Digita la tua email"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border 
                    not-focus:border-app-border transition-all"
                />
              </div>
            </label>

            <label className="text-sm flex flex-col gap-1">
              Password
              <div className="relative">
                <LockIcon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 
                                text-app-text-light"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digita la tua password"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border 
                    not-focus:border-app-border transition-all"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex-center w-full py-3 bg-green-600 text-white font-semibold rounded-xl 
              hover:bg-green-900 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2Icon className="animate-spin" />
              ) : isLoginState ? (
                'Entra'
              ) : (
                'Iscriviti'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
