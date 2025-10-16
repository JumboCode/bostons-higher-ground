/*
 * TODO: This component is the popup that should appear when the user clicks on
 * the "forgot password" button on the login page.
 */
"use client";
import { X } from "react-feather";
import { useState } from "react";
 

type Props = {
    isOpen: boolean;
    onClose: boolean;
}
function ForgotPasswordModal({ isOpen, onClose }: Props) {
    
    if(!isOpen) return null;
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
                    Enter your email address and we'll send you a link to reset your password.

                </p>

                <p className="font-manrope font-medium text-[14px] leading-[20px] w-[92px] h-[20px] mt-[16px] text-[#555555]">
                    Email Address
                </p>

                <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-[398px] h-[36px] rounded-[14px] pt-[4px] pr-[12px] pl-[12px] bg-[#F3F3F5] mt-[8px]
                        placeholder: font-manrope font-normal text-[14px] leading-[20px] placeholder:text-[#717182] placeholder:opacity-100">
                </input>

                <div className="flex gap-[12px] mt-[16px] items-center">
                    <button className="w-[193px] h-[36px] rounded-[14px] border-[1px] border-[#0000001A]  py-[8px] px-[16px] font-manrope font-medium leading-[20px] hover:opacity-80 
                        text-[#555555] font-manrope text-[14px]"
                        onClick = {onClose}
                        >
                        Cancel
                    </button>

                    <button className="w-[193px] h-[36px] rounded-[14px] bg-[#D26879] py-[8px] px-[16px] font-manrope font-medium leading-[20px]
                        text-[#FFFFFF] font-manrope text-[14px]">
                        Sent Reset Link
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
    
    return (
        <main className="flex justify-center w-full mt-4">
            
            {/* we use components within our JSX similarly to html tags*/}
            <button
                className= "whitespace-nowrap absolute top-[473.5px] left[133.77px] w-[119px] h-[20px] text-[#E76C82] font-manrope font-semibold text-[14px] leading-[20px] tracking-[0px] hover:opacity-80"
                onClick={() => setIsOpen(true)}
                >
                Forgot Password?

            </button>
    
            <ForgotPasswordModal 
                isOpen = {isOpen}
                onClose={() => setIsOpen(false)}
            />
        </main>
    );
}
