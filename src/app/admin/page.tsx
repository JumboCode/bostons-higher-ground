"use client";
import { useState } from "react";
import NavBar from "../../components/navbar";
import InviteCard from "../../components/inviteCards";

// import font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets: ["latin"] });

// import popins
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"], // Added 600 for semibold
});

import {
  Search,
  CircleCheckBig,
  UsersRound,
  Send,
  RefreshCcw,
  MoreVertical,
  Shield,
  Eye,
  Trash2,
} from "lucide-react";

type User = {
  name: string;
  email: string;
  status: "Active" | "Pending";
  role?: string;
};

export default function Admin() {
  // for invite staff pop up
  const [isOpen, setIsOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Hardcoded users array
  const [users, setUsers] = useState<User[]>([
    { name: "Alice Johnson", email: "alice@example.com", status: "Active", role: "Admin" },
    { name: "Bob Smith", email: "bob@example.com", status: "Pending" },
    { name: "Charlie Brown", email: "charlie@example.com", status: "Active" },
    { name: "Dana Lee", email: "dana@example.com", status: "Pending" },
    { name: "Evan Wright", email: "evan@example.com", status: "Active" },
  ]);

  // Derived state: Filter users based on search query
  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={`flex min-h-screen bg-[#F5F5F5] ${manrope.className}`}>
      <NavBar />

      <div className="relative flex-1 overflow-x-hidden min-h-screen pb-20">
        {/*Top bar*/}
        <div className="w-full h-[64px] border-b border-[#E5E7EB] bg-[#FFFFFF]"></div>

        {/*Title*/}
        <div className="mt-[20px] px-4 md:px-[45px] flex items-center justify-between">
          <h1 className={`text-[#555555] text-[24px] md:text-[28px] leading-[42px] font-bold ${poppins.className}`}>
            Admin Settings
          </h1>
          <button 
            className="px-[10px] py-[5px] rounded-xl border border-[#E76C82] text-[#E76C82] hover:bg-[#E76C82] hover:text-white transition-colors flex items-center justify-center gap-2"
            onClick={() => window.location.reload()} 
          >
            <RefreshCcw className="w-[17px] h-[17px]"/>
            Update Data
          </button>
        </div>

        {/*Alert Box */}
        <div className="mt-[13px] mx-4 md:mx-[45px] h-[46px] bg-[#4CAF501A] border border-[#4CAF5033] rounded-[16px] px-4 flex items-center">
          <CircleCheckBig className="w-[16px] h-[16px] text-[#555555]" />
          <p className="text-[12px] md:text-[14px] text-[#555555] leading-[20px] pl-[10px]">
            Last sync from Salesforce: Today at 12:44AM
          </p>
        </div>

        {/*Table Container*/}
        <div className="mt-[25px] mx-4 md:mx-[45px] min-h-[500px] border border-[#0000001A] rounded-[20px] bg-[#FFFFFF] p-[16px] md:p-[24px] flex flex-col shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-[12px]">
              <div className="w-[45px] h-[45px] rounded-[16px] bg-[#F0E7ED] flex items-center justify-center shrink-0">
                <UsersRound className="w-[25px] h-[25px] text-[#E76C82]" />
              </div>

              <div>
                <h2 className={`text-[#555555] text-[20px] leading-[30px] font-semibold h-[30px] ${poppins.className}`}>
                  User Management
                </h2>

                <p className="text-[14px] leading-[21px] text-[#ABABAB]">
                  {filteredUsers.length} members
                </p>
              </div>
            </div>

            {/*Invite Staff*/}
            <button
              onClick={() => setIsOpen(true)}
              className="pl-[15px] pr-[18px] py-[8px] h-[40px] rounded-[14px] bg-[#E76C82] hover:bg-[#d75c6f] transition-colors flex items-center justify-center text-[#FFFFFF] text-[15px] leading-[20px] gap-[12px] shrink-0"
            >
              <Send className="w-[18px] h-[18px]" />
              Invite Staff
            </button>
          </div>

          {/*Search bar*/}
          <div className="relative pt-[10px]">
            <Search className="mt-[25px] absolute left-[12px] top-[13.5px] w-[20px] h-[20px] text-[#ABABAB]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full mt-[12px] top-[66px] h-[55px] rounded-[14px] border border-[#D9D9D9] px-[44px] py-[12px] pr-[16px] outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100 transition-all"
            />
          </div>

          {/* User List */}
          <div className="mt-[35px] mx-[8px] flex flex-col">
            {/* Header */}
            <div className="hidden md:flex w-full text-[#555555] font-semibold mb-3 px-2">
              <span className="text-left w-1/4">Member</span>
              <span className="text-left flex-grow w-1/3">Email</span>
              <span className="text-center w-1/6">Status</span>
              <span className="text-right w-1/6">Actions</span>
            </div>

            {/* Dividing line for the table */}
            <div className="hidden md:block border-b border-[#E0E0E0] mb-3"></div>

            {/* Rows */}
            <div className="flex flex-col gap-2 overflow-auto max-h-[60vh]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                    <UserRow key={idx} user={user} />
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">No users found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-[0px] flex w-full">
        {/* Spacer for NavBar */}
        <div className="hidden md:block w-[286px]" />

        {/* Main content footer */}
        <div className="flex-1 h-[66px] border-t border-[#E5E7EB] flex items-center justify-center px-[32px] bg-white">
          <footer className="text-[12px] text-[#6A7282]">
            © 2025 Higher Ground Boston. For authorized staff use only.
          </footer>
        </div>
      </div>

      <InviteCard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </main>
  );
}

function UserRow({ user }: { user: User }) {
  const [actionVisible, setActionVisible] = useState(false);

  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-3 border-b last:border-b-0 border-[#F0F0F0] px-2 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Member */}
      <div className="flex items-center gap-3 w-full md:w-1/4 mb-2 md:mb-0">
        <div className="w-10 h-10 rounded-full bg-[#E76C82] flex items-center justify-center text-white font-bold shrink-0">
          {user.name[0]}
        </div>
        <div className="flex flex-col">
          <span className={`font-semibold text-[#111827] ${poppins.className}`}>{user.name}</span>
          {user.role && (
            <span className="flex items-center text-[12px] text-[#E76C82] gap-[3px]">
              <Shield className="w-[12px] h-[12px]" />
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="text-gray-400 text-sm md:text-base text-left flex-grow w-full md:w-1/3 mb-2 md:mb-0 truncate">
        {user.email}
      </div>

      {/* Status */}
      <div className="flex md:block items-center justify-between w-full md:w-1/6 md:text-center mb-2 md:mb-0">
        <span className="md:hidden text-gray-500 text-sm">Status:</span>
        <span
          className={`px-2 py-1 rounded-full text-[12px] font-medium ${
            user.status === "Active"
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {user.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex md:block justify-end w-full md:w-1/6 text-right relative">
        <button 
            onClick={() => setActionVisible(!actionVisible)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
        </button>
        
        <ActionPopUp actionVisible={actionVisible} close={() => setActionVisible(false)}/>
      </div>
    </div>
  );
}

function ActionPopUp({ actionVisible, close }: { actionVisible: boolean, close: () => void }) {
  if (!actionVisible) return null;

  return (
    <div className="absolute right-0 top-8 z-50 flex flex-col bg-[#FFFFFF] shadow-lg rounded-xl font-manrope border border-gray-200 min-w-[180px] overflow-hidden">
      <button 
        onClick={close}
        className="flex items-center gap-[8px] px-4 py-3 hover:bg-gray-50 text-left transition-colors w-full text-sm text-gray-700"
      >
        <Eye className="text-[#717182] w-[18px] h-[18px]" />
        View Activity
      </button>
      
      <button 
        onClick={close}
        className="flex items-center gap-[8px] px-4 py-3 hover:bg-gray-50 text-left transition-colors w-full text-sm text-gray-700"
      >
        <Send className="text-[#717182] w-[18px] h-[18px]" />
        Resend Invite
      </button>
      
      <button 
        onClick={close}
        className="flex items-center gap-[8px] px-4 py-3 hover:bg-red-50 text-left transition-colors w-full text-sm text-[#D9534F]"
      >
        <Trash2 className="w-[18px] h-[18px]" />
        Remove User
      </button>
    </div>
  );
}