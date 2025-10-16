/*
 * TODO: This component is the popup that should appear when the user clicks on
 * the "forgot password" button on the login page.
 */

import Image from "next/image";

//importing the logo image
import logo from "./logo.jpg";
//importing the background image
import bg from "./bg.png";
//import the font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

function ForgotPasswordModal() {
    return (
        <div></div>
    );
}

/*
 * TODO: This function is the top level component of the login page. All of the
 * JSX returned by this function will be rendered on the /login route. Complete
 * the component to match the designs provided in the ticket.
 */
export default function LogIn() {
    return (
        <main className="relative min-h-[100dvh] w-full overflow-x-hidden">
            {/* we use components within our JSX similarly to html tags*/}

            {/* BACKGROUND IMAGE (full-bleed) */}
            <div className="absolute inset-0 -z-10">
              <Image 
              src={bg}
              alt="Background"
              fill
              priority
              className="object-cover opacity-90" //normally it says 5 but I can't see it when it's 5
              />
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
            </div>

            

            {/* CENTERED CARD */}
           <section className="min-h-screen flex items-center justify-center">
              <div
                style={{
                  width: "384px",
                  height: "595px",
                  borderRadius: "24px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #F3F4F6",
                  boxShadow: "0px 25px 50px -12px #A74A5B33",
                  transform: "rotate(0deg)",
                  opacity: 1,
                }}
                className="p-8 flex flex-col"
              >
                {/* LOGO */}
                <div className="mx-auto mb-6 flex items-center justify-center gap-2">
                  <Image
                    src={logo}
                    alt="Higher Ground Boston"
                    width={149}
                    height={99}
                    style={{
                      transform: "rotate(0deg)",
                      opacity: 1,
                    }}
                  />
                </div>


                {/* HEADLINE + SUBTITLE */}
                <h1 className="text-center text-2xl font-semibold text-neutral-800">
                  Welcome Back
                </h1>
                <p className="mt-1 text-center text-sm text-neutral-500">
                  Sign in to access your dashboard
                </p>

                {/* Currently a D,v but turn to FORM (visual only) */}
                <div className="mt-8 space-y-5">
                  {/* EMAIL FIELD */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-neutral-700"
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

                  {/* PASSWORD FIELD */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-neutral-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-100/70 px-4 py-3 text-neutral-800 outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100"
                    />
                  </div>

                  {/* PRIMARY BUTTON */}
                  <button
                    type="submit"
                    className={`${manrope.className} mt-1 w-full text-center text-white transition`}
                    style={{
                      backgroundColor: "#D26879",
                      width: "318px",
                      height: "48px",
                      borderRadius: "14px",
                      transform: "rotate(0deg)",
                      opacity: 1,
                    }}
                  >
                    Sign In
                  </button>

                  {/* FORGOT PASSWORD LINK (wire this to open the modal later) */}
                 <div className="text-center">
                  <button
                    type="button"
                    className={`${manrope.className} underline-offset-4 hover:underline`}
                    style={{
                      color: "#E76C82",
                      fontWeight: 600,
                      fontStyle: "normal",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0px",
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                  {/* HAIRLINE DIVIDER */}
                  <div className="mt-4 h-px w-full bg-neutral-200" />
                </div>


                {/* FOOTNOTE / LEGAL LINE */}
                <p className="mt-4 text-center text-xs text-neutral-400">
                  For authorized Boston Higher Ground staff only
                </p>
              </div>
            </section>

            {/* Modal shell included but hidden */}



            <ForgotPasswordModal />
        </main>
    );
}