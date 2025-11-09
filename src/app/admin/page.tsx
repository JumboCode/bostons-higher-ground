"use client";
import { useState } from "react";
import NavBar from "../../components/navbar";
import InviteCard from "../../components/inviteCards";

// import font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

// import popins
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});

import {Search, CircleCheckBig, UsersRound, Send, RefreshCcw, MoreVertical} from "lucide-react";


type User = {
    name: string;
    email: string;
    status: "Active" | "Pending";
    role?: string;
};

export default function Admin(){
    const [isOpen, setIsOpen] = useState(false);

    // Hardcoded users array
    const [users, setUsers] = useState<User[]>([
        { name: "Alice Johnson", email: "alice@example.com", status: "Active", role: "Admin" },
        { name: "Bob Smith", email: "bob@example.com", status: "Pending" },
        { name: "Charlie Brown", email: "charlie@example.com", status: "Active" },
        { name: "Dana Lee", email: "dana@example.com", status: "Pending" },
    ]);

    // numMembers
    const [numMembers, setNumMembers] = useState(users.length);

    return (
        <main className="flex min-h-screen bg-[#F5F5F5] ">

            <NavBar />

            <div className="relative flex-1 overflow-x-hidden min-h-[717px]">
                {/*Top bar*/}
                <div className="w-full h-[64px] border-b border-[#E5E7EB] bg-[#FFFFFF]"></div>

                {/*Title*/}
                <div className="mt-[20px] mx-[45px] flex items-center justify-between">
                    <h1 className="text-[#555555] text-[28px] leading-[42px] font-poppins font-bold ">
                        Admin Settings
                    </h1>
                    <button className="px-[10px] py-[5px] rounded-xl border border-[#E76C82] text-[#E76C82] flex items-center justify-center gap-2">
                        <RefreshCcw className="w-[17px] h-[17px] text-[#E76C82]"/>
                        Update Data
                    </button>
                </div>

                {/*Alert Box */}
                <div className="mt-[13px] mx-[45px] h-[46px] bg-[#4CAF501A] border border-[#4CAF5033] rounded-[16px] px-4 flex items-center">
                    <CircleCheckBig className="w-[16px] h-[16px] text-[#555555]"/>
                    <p className="font-manrope text-[14px] text-[#555555] leading-[20px] pl-[10px]">
                        Last sync from Salesforce: Today at 12:44AM
                    </p>
                </div>
            

                {/*Table*/}
                <div className="mt-[25px] mx-[45px] h-[538px] border border-[#0000001A] rounded-[20px] bg-[#FFFFFF] p-[24px] flex flex-col">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[12px]">
                            <div className="w-[45px] h-[45px] rounded-[16px] bg-[#F0E7ED] flex items-center justify-center">
                                <UsersRound className="w-[25px] h-[25px] text-[#E76C82]"/>
                            </div>

                            <div>
                                <h2 className="text-[#555555] text-[20px] leading-[30px] font-poppins font-semibold h-[30px]">
                                    User Management
                                </h2>

                                <p className="font-manrope text-[14px] leading-[21px] text-[#ABABAB]">
                                    {numMembers} members
                                </p>
                            </div>
                        </div>

                        {/*Invite Staff*/}
                        <button 
                            onClick={() => setIsOpen(true)}
                            className="pl-[15px] pr-[18px] py-[8px] h-[40px] rounded-[14px] bg-[#E76C82] flex items-center justify-center
                            text-[#FFFFFF] font-manrope text-[15px] leading-[20px] gap-[12px]">
                                <Send className="w-[18px] h-[18px]"/>
                                Invite Staff   
                        </button>
                    </div>

                    {/*Search bar*/}
                    <div className="relative pt-[10px]">
                        <Search className="mt-[25px] absolute left-[12px] top-[13.5px] w-[20px] h-[20px] text-[#ABABAB]"/>
                        <input
                            type="text"
                            placeholder="Search by name or email..."                                  
                            className="w-full mt-[12px] top-[66px] h-[55px] rounded-[14px] border border-[#D9D9D9] px-[44px] py-[12px] pr-[16px] outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100">
                        </input>
                    </div>
                    
                    {/* ALL USERS!! */}
                    <div className="mt-[35px] mx-[8px] flex flex-col">
                        {/* Header */}
                        <div className="flex w-full text-[#555555] font-manrope font-semibold mb-3">
                            <span className="text-left w-1/6">Member</span>
                            <span className="text-center flex-grow w-1/3">Email</span>
                            <span className="text-center w-1/6">Status</span>
                            <span className="text-right w-1/6">Actions</span>
                        </div>

                        {/* Dividing line for the table */}
                        <div className="border-b border-[#E0E0E0] mb-3"></div>

                        {/* Rows */}
                        <div className="flex flex-col gap-2 overflow-auto max-h-[60vh]">
                            {users.map((user, idx) => (
                                <UserRow key={idx} user={user} />
                            ))}
                        </div>
                        </div>
                    </div>
            </div>


            {/* Footer */}
            <div className="absolute bottom-0 left-[0px] flex w-full">
                {/* Spacer for NavBar */}
                <div className="w-[286px]" />  

                {/* Main content footer */}
                <div className="flex-1 h-[66px] border-t border-[#E5E7EB] flex items-center justify-center px-[32px]">
                    <footer className="text-[12px] text-[#6A7282]">
                        © 2025 Higher Ground Boston. For authorized staff use only.
                    </footer>
                </div>
            </div>
            
            <InviteCard isOpen={isOpen} onClose={() => setIsOpen(false)}/>

        </main>
    );
}

function UserRow({ user }:{ user:User }) {
    return(
        <div className="flex items-center justify-between py-3 border-b last:border-b-0  border-[#F0F0F0]">
            {/* Member */}
            <div className="flex items-center gap-3 w-1/6">
                <div className="w-10 h-10 rounded-full bg-[#E76C82] flex items-center justify-center text-white font-bold">
                    {user.name[0]}
                </div>
                <div className="flex flex-col">
                    <span className="font-poppins font-semibold text-[#111827]">{user.name}</span>
                    {user.role && (
                        <span className="text-[12px] text-[#E76C82]">{user.role}</span>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="text-gray-400 text-center flex-grow w-1/3">{user.email}</div>

            {/* Status */}
            <div className="text-center w-1/6 ml-auto">
                <span
                    className={`px-2 py-1 rounded-full text-[12px] ${
                        user.status === "Active" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                        }`}
                    >
                    {user.status}
                </span>
            </div>

            {/* Actions */}
            <div className="text-right w-1/6">
                <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
            </div>
        </div>
    );
}