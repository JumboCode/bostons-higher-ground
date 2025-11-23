/*
 * TODO: This component is the popup that should appear when the user clicks on
 * the "forgot password" button on the login page.
 * change the color to the gey color of welcome back 
 * for the forgot password, the button should be slightly different color
 * hover over the button change color for submit 
 * Change the sizing
 */
"use client";
import Image from "next/image";

import { authClient } from "@/lib/auth-client";

//importing the logo image
import logo from "./logo.jpg";
//importing the background image
import bg from "./bg.png";
//import the font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

// import popins

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});



import { X } from "react-feather";
import React, { useState } from "react";
 

type Props = {
    isOpen: boolean;
    onClose: () => void;
}


function ForgotPasswordModal({ isOpen, onClose }: Props) {
    const [email, setEmail] = useState("");
    if(!isOpen) return null;
    const hasEmail = email.trim().length > 0;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className= "bg-[#FFFFFF] w-[448px] h-[248px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 relative"
        > 
            {/*Close button*/}
            <button
                onClick = {onClose}
                className="absolute top-4 right-4">
                <X className="w-4 h-4 text-[#555555] opacity-70" />

            </button>

            <div className="absolute top-[25px] left-[25px] w-[398px] h-[66px]">
                {/*Reset Password Heading*/}
                <h2 className="font-poppins font-semibold text-[18px] leading-[18px] text-[#555555]">
                    Reset Password
                </h2>

                <p className="font-manrope font-regular text-[14px] leading-[20px] text-[#717182] mt-[8px]">
                    Enter your email address and we&#39;ll send you a link to reset your password.

                </p>

                <p className="font-manrope font-medium text-[14px] leading-[20px] w-[92px] h-[20px] mt-[16px] text-[#555555]">
                    Email Address
                </p>


                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}             
                    onChange={(e) => setEmail(e.target.value)}                      
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-100/70 px-4 py-3 text-neutral-800 outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100">
                </input>

                <div className="flex gap-[12px] mt-[16px] items-center">
                    <button className="w-[193px] h-[36px] rounded-[14px] border-[1px] border-[#0000001A]  py-[8px] px-[16px] font-manrope font-medium leading-[20px] hover:opacity-80 
                        text-[#555555] font-manrope text-[14px]"
                        onClick={onClose}
                        >
                        Cancel
                    </button>

                    <button 
                    type="button"
                    className="w-[193px] h-[36px] rounded-[14px] bg-[#D26879] py-[8px] px-[16px] font-manrope font-medium leading-[20px] text-[#FFFFFF] font-manrope text-[14px]"
                    style={{ backgroundColor: hasEmail ? "#E76C82" : "#E59AA8" }}  
                    disabled={!hasEmail} >

                    Send Reset Link
                    </button>
                
                </div>

            </div>
            </div>
        </div>
    );
}

/*
 * TODO: This function is the top level component of the login page. All of the
 * JSX returned by this function will be rendered on the /login route. Complete
 * the component to match the designs provided in the ticket.
 */
export default function LogIn() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setError] = useState<string | null >();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const result = await authClient.signIn.email(
        {email: email, 
        password: password} 
      )

      if (result.error) {
        setError(result.error.message ?? "An unknown error occurred")
      }
      else {
        setError(null)
        console.log( "Successfully logged in!")
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong")
      }
      else {
        console.log(err)
      }
    }
    }

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
              className="object-cover opacity-50" //normally it says 5 but I can't see it when it's 5
              />
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
            </div>

            

            {/* CENTERED CARD  extend the box*/}
           <section className="min-h-screen flex items-center justify-center">
              <div
                style={{
                  width: "384px",
                  height: "695px",
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


                {/* HEADLINE + SUBTITLE change collor*/}
                <h1
                className={`${poppins.className} text-center`}
                style={{
                  color: "#555555",
                  fontWeight: 700,
                  fontStyle: "bold",
                  fontSize: "24px",
                  lineHeight: "42px",
                  letterSpacing: "0px",
                  textAlign: "center",
                }}
                >
                  Welcome Back
                </h1>
                <p 
                className={`${manrope.className} mt-1 text-center text-sm text-neutral-500'`}
                style={{
                  color: "#4A5565",
                  fontWeight: 400,
                  fontStyle: "regular",
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0px",
                  textAlign: "center",

                }}
                >
                  Sign in to access your dashboard
                </p>
                
                {/* Currently a D,v but turn to FORM (visual only) */}
                <div className="mt-8 space-y-5">
                  {/* EMAIL FIELD */}
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
                      onChange={(e) => setEmail(e.target.value)}
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
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-100/70 px-4 py-3 text-neutral-800 outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100"
                    />
                  </div>

                  {/* PRIMARY BUTTON */}
                  <button
                    type="submit"
                    onClick={handleClick}
                    className={`${manrope.className} mt-1 w-full text-center text-white transition`}
                    style={{
                      backgroundColor: "#E59AA8",
                      width: "318px",
                      height: "48px",
                      borderRadius: "14px",
                      transform: "rotate(0deg)",
                      opacity: 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E76C82")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E59AA8")}

                  >
                    Sign In
                  </button>

                  {/* FORGOT PASSWORD LINK (wire this to open the modal later) */}
                 <div className="text-center">
                  <button
                    type="button"
                    className={`${manrope.className} underline-offset-4 hover:underline`}
                    onClick={() => setIsOpen(true)}
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



            <ForgotPasswordModal 
                isOpen = {isOpen}
                onClose={() => setIsOpen(false)}
            />
        </main>
    );
}