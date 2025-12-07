export default function Register() {
        return (
                <div>
                <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-neutral-700 "
                    >
                      Email Address
                    </label>
                    <input 
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-100/70 px-4 py-3 text-neutral-800 outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100"
                    />
                </div>
        )
}