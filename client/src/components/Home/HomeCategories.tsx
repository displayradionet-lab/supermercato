import { Link } from 'react-router-dom';
import { categoriesData } from '../../assets/assets';

const HomeCategories = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold">Guarda le Categorie</h2>
        <p className="text-sm text-app-text-light mt-1">
          Trova quello che ti serve
        </p>
      </div>
      <div className="flex items-center mt-8 overflow-x-scroll no-scrollbar">
        {categoriesData.map((cat) => (
          <Link
            key={cat.slug}
            to={`/products?category=${cat.slug}`}
            onClick={() => window.scrollTo(0, 0)}
            className="group flex flex-col items-center gap-3 p-4"
          >
            <div
              className="size-24 sm:size-26 sm:p-2 rounded-full overflow-hidden bg-green-100 
          group-ring-3 ring-green-400 transition-all"
            >
              <img
                src={cat.image}
                alt="cat.name"
                className="w-full h-full object-contain rounded-full transition-all"
              />
            </div>
            <span className="text-xs font-medium text-zinc-600 text-center leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeCategories;
