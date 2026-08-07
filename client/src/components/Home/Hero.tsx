import { ArrowRightIcon, LeafIcon } from "lucide-react"
import { heroSectionData } from "../../assets/assets"
import { Link } from "react-router-dom"


const Hero = () => {
  return (
    <section className="relative overflow-hidden min-h-135 mb-10 rounded-3xl flex items-center ">
        <img src={heroSectionData.hero_image} alt="Hero"
        className="absolute inset-0 h-full w-full object-cover" />

        <div className="absolute inset-0 bg-linear-to-r from-app-green via-app-green/65 to-transparent"/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="max-w-xl xl:pl-10">
                <span className="">
                    <LeafIcon size={3}/>
                    Prodotti sempre freschi e senza pesticidi</span>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
                        Nutri la tua casa con <span className="text-orange-300">Earth's finest</span></h1>
                        <p className="text-base text-white/70 leading-relaxed 
                        mb-8 max-w-md">{heroSectionData.description}</p>

                        <div className="flex flex-wrap gap-4">
                           <Link to={'/products'}
                            className="px-7 py-2 bg-orange-400 text-white font-semibold rounded-full 
                            hover:bg-orange-500 transition-all flex-center gap-2 active:scale-[0.98]">
                           Compra Ora <ArrowRightIcon className="size-4"/>
                           </Link> 
                           <Link to={'/categories'}
                            className="px-7 py-2 bg-white/10 text-white font-semibold rounded-full 
                            hover:bg-white/20 flex-center gap-2 transition-all border border-white/20">
                           Categorie <ArrowRightIcon className="size-4"/>
                           </Link> 

                        </div>
            </div>
        </div>
    </section>
  )
}

export default Hero