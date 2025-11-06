import Logo from "./BHG_Logo.png"
import Image from 'next/image'

export default function OnboardingLayout({ children, } : { children : React.ReactNode } ) {
    return (
        <html lang="en">
            <body className="">
                <div className="min-h-dvh flex flex-col bg-gradient-to-br from-rose-50 to-amber-50">
                    <header className="p-5">
                        <div className="flex flex-row justify-between">
                            <div className="flex flex-row space-x-4 items-center">
                                <Image
                                src= { Logo}
                                alt="Description of image"
                                width={40}
                                height={40}
                                />
                                <div>
                                    <p className="font-semibold text-[#555555] tracking-tight text-lg leading-none">Boston Higher Ground</p>
                                    <p className="font-extralight text-sm">Internal Dashboard</p>
                                </div>
                            </div>
                            <div>
                                <button className="border border-[#E76C82] text-[#E76C82] rounded-xl px-4 py-2 font-semibold text-base">Sign In</button>
                            </div>
                        </div>
                    </header>
                    <main className="flex flex-1">
                        {children} 
                    </main>
                    <footer className="p-5">
                        <p>footer</p>
                    </footer>
                </div>
            </body>
        </html>
    );
}