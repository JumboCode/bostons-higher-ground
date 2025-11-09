import { useState } from "react"; 
import { Send } from "lucide-react";

export default function InviteCard ({ isOpen, onClose }:{ isOpen:boolean, onClose: () => void}){
    if(!isOpen) return null;

    const [formData, setFormData] = useState({ name: "", email: "" });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = () => {
        console.log("Form data to send:", formData);
        // backend stuff yipee
    };

    return(
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-[#FFFFFF] w-[400px] max-h-[90vh] overflow-y-auto rounded-xl p-6 flex flex-col justify-between shadow-[0_10px_30px_5px_#A74A5B44]">
                <h2 className="mb-[20px] text-center text-[#555555] text-[20px] font-poppins font-bold">
                    Invite Member
                </h2>

                {/* Fields for name and email */}
                <div className="flex flex-col gap-4 mb-6">
                    <div>
                        <label className="text-[#555555] font-poppins">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="First and Last"
                            required
                            className="w-full rounded-xl bg-[#F3F3F5] px-4 py-2 outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="text-[#555555] font-poppins">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="name@higherground.org"
                            className="w-full rounded-xl bg-[#F3F3F5] px-4 py-2 outline-none"
                        />
                    </div>
                </div>

                <div className="mb-[25px] px-[13px] py-[13px] rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] text-[#1C398E] text-sm font-poppins">
                    The staff member will receive an email with a temporary code and link to create their account.
                </div>

                {/* Bro just invite the person */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="w-1/2 px-4 py-2 rounded-lg border border-[#D9D9D9] text-[#555555] font-poppins hover:bg-gray-200">
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="w-1/2 px-4 py-2 rounded-lg bg-[#E76C82] text-white font-poppins hover:bg-[#d75c6f] flex items-center justify-center gap-3">
                        <Send className="w-[18px] h-[18px]"/>
                        Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
}

function InvitationSent() {
    return(
        <div>
                
        </div>
    );
}