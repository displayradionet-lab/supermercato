import { XIcon } from "lucide-react"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AddressForm = ({resetForm, handleSubmit, form, setForm, editingId}: any) => {
  return (
    <>
    {/* overlay */}
    <div  className="fixed inset-0 bg-black/40 z-50"/>

    {/* form container */}
    <div onClick={resetForm} className="fixed inset-0 z-50 flex-center p-4">
        <form onClick={e=>e.stopPropagation()}
        onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">

            {/* form header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-green-600">
                    {editingId ? "Modifica indirizzo" : "Aggiungi indirizzo"}</h2>
                <button type="button" onClick={resetForm}
                className="p-2 hover:bg-app-cream rounded-lg">
                    <XIcon className="size-5"/>
                </button>
            </div>

            {/* form input fields */}
            <div className="space-y-4">
                <div className="">
                    <label className="block text-sm font-medium text-green-600 mb-1.5">Label</label>
                    <input type="text" placeholder="Casa, Lavoro, etc..." required value={form.label}
                    onChange={(e)=> setForm({...form, label: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border 
                    focus:border-app-green outline-none"/>
                </div>
                   <div className="">
                    <label className="block text-sm font-medium text-green-600 mb-1.5">Strada</label>
                    <input type="text" required value={form.address}
                    onChange={(e)=> setForm({...form, address: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border 
                    focus:border-app-green outline-none"/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="block text-sm font-medium text-green-600 mb-1.5">Citta`</label>
                    <input type="text" required value={form.city}
                    onChange={(e)=> setForm({...form, city: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border 
                    focus:border-app-green outline-none"/>
                </div>
                    <div>
                    <label className="block text-sm font-medium text-green-600 mb-1.5">Stato</label>
                    <input type="text" required value={form.state}
                    onChange={(e)=> setForm({...form, state: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border 
                    focus:border-app-green outline-none"/>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                     <label className="block text-sm font-medium text-green-600 mb-1.5">Zip Code</label>
                    <input type="text" required value={form.zip}
                    onChange={(e)=> setForm({...form, zip: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border 
                    focus:border-app-green outline-none"/>
                    </div>
                    <div className="flex items-end pb-1">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isDefault} 
                        onChange={(e)=>setForm({...form, isDefault: e.target.checked})}/>
                        <span className="text-sm text-app-text">Set as Default</span>
                     </label>
                  
                    </div>
                </div>
            </div>

            {/* submit button */}
            <button type="submit" className="mt-6 w-full py-3 bg-green-700 text-white font-semibold 
            rounded-xl hover:bg-green-800 transition-colors">
                {editingId ? "Aggiorna indirizzo" : "Salva Indirizzo"}
            </button>
        </form>
    </div>
    </>
  )
}

export default AddressForm