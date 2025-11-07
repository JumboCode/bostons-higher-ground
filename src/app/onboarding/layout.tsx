import Logo from "./BHG_Logo.png"
import Image from 'next/image'

export default function OnboardingLayout({ children, } : { children : React.ReactNode } ) {
    return (
        <html lang="en">
            <body>
                <div className="min-h-dvh flex flex-col bg-gradient-to-br from-pink-50 via-white to-yellow-50">
                    <header className="p-8">
                        <div className="flex flex-row justify-between">
                            <div className="flex flex-row space-x-4 items-center">
                                <Image
                                src= { Logo }
                                alt="Description of image"
                                width={50}
                                height={57}
                                />
                                <div>
                                    <p className="text-[#555555] font-semibold leading-tight text-lg">Boston Higher Ground</p>
                                    <p className="text-[#555555] font-extralight text-sm">Internal Dashboard</p>
                                </div>
                            </div>
                            <div>
                                <a href="../login">
                                    <button className="border border-[#E76C82] text-[#E76C82] rounded-xl px-4 py-2 font-semibold text-base">Sign In</button>
                                </a>
                            </div>
                        </div>
                    </header>
                    {children}
                    <footer className="py-4">
                        <hr className="my-4 h-0.5 border-t-0 bg-neutral-200"/>
                        <p className="text-center text-[#555555] font-extralight">&copy; 2025 Boston Higher Ground. For authorized staff use only.</p>
                    </footer>
                </div>
            </body>
        </html>
    );
}