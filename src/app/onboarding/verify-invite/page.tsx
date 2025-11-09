"use client"
import * as Icon from "feather-icons-react"
import { useState } from "react";


export default function Page() {
    type valueProps = {
        emailAddress: string;
        tempCode: string;
    }
    const [values, setValues] = useState()
    return (
        <main className="flex flex-1 flex-col justify-center items-center space-y-5">
                <div className="flex flex-col px-16 text-[#555555]">
                    <p className="text-center text-3xl font-bold">Welcome</p>
                    <p className="text-center text-base font-extralight">Create your account to get started</p>
                </div>
                <div className="flex flex-col border-0 p-8 rounded-3xl bg-white space-y-8 shadow-[0px_24px_50px_0px_rgba(167,_74,_91,_0.2)] max-w-[400px]">
                    <p className="text-2xl font-semibold px-5 text-[#555555]">Verify your information</p>
                    <form className="space-y-5">
                        <div className="flex flex-col space-y-1">
                            <div className="space-x-1">
                                <label>Email Address</label>
                                <span className="text-[#D9534F]">*</span>
                            </div>
                            <input name="temp-code" placeholder="name@higherground.org" className="bg-[#F3F3F5] py-2 rounded-xl px-3 "/>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <div className="space-x-1">
                                <label>Temporary Code</label>
                                <span className="text-[#D9534F]">*</span>
                            </div>
                            <input name="temp-code" placeholder="750WEFT" className="bg-[#F3F3F5] py-2 rounded-xl px-3 "/>
                        </div>
                        <button type="submit" className="flex py-2.5 w-full rounded-xl text-white justify-center bg-[#E76C82] space-x-1">
                            <p>Continue</p>
                            <Icon.ArrowRight className="stroke-2"/>
                        </button>
                    </form>
                </div>
        </main>
    );
}