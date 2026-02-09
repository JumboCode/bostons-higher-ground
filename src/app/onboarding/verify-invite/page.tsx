"use client";
import * as Icon from "feather-icons-react";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Page() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [tempCode, setTempCode] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isTempCodeValid, setIsTempCodeValid] = useState(false);
    const [isEmailBlur, setIsEmailBlur] = useState(false);
    const [isTempCodeBlur, setIsTempCodeBlur] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [tempCodeError, setTempCodeError] = useState("");
    const [tempCodePopup, setTempCodePopup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "email") {
            if (value.length > 1) {
                setIsEmailValid(true);
            }
            setEmail(value);
        } else if (name === "tempCode") {
            if (value.length > 1) {
                setIsTempCodeValid(true);
            }
            setTempCode(value);
        }
    };

    const blurHandlerEmail = () => {
        setIsEmailBlur(true);

        if (email == "") {
            setEmailError("Email is required");
            setIsEmailValid(false);
        } else {
            setEmailError("");
            setIsEmailValid(true);
        }
    };
    
    const blurHandlerTempCode = () => {
        setIsTempCodeBlur(true);

        if (tempCode == "") {
            setTempCodeError("Temporary code is required");
            setIsTempCodeValid(false);
        } else {
            setTempCodeError("");
            setIsTempCodeValid(true);
        }
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setEmailError("");
        setTempCodeError("");

        try {
            const response = await fetch("/api/verify-invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    tempCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setTempCodeError(data.error || "Invalid email or verification code");
                } else {
                    setTempCodeError(data.error || "An error occurred");
                }
                setIsSubmitting(false);
                return;
            }
            router.push("/onboarding/create-account");
        } catch (error) {
            console.error("Verification error:", error);
            setTempCodeError("An error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };
    const togglePopup = () => {
        setTempCodePopup(!tempCodePopup);
    };

    const isFormComplete = email.length && tempCode;

    return (
        <main className="flex flex-1 flex-col justify-center items-center space-y-5 -mt-[200px]">
            <div className="flex flex-col px-16 text-[#555555]">
                <p className="text-center text-3xl font-bold">Welcome</p>
                <p className="text-center text-base font-extralight">
                    Create your account to get started
                </p>
            </div>
            <div className="flex flex-col border-0 p-8 rounded-3xl bg-white space-y-8 shadow-[0px_24px_50px_0px_rgba(167,_74,_91,_0.2)] max-w-[400px]">
                <p className="text-2xl font-semibold px-5 text-[#555555]">
                    Verify your information
                </p>
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col space-y-1">
                        <div className="space-x-1">
                            <label>Email Address</label>
                            <span className="text-[#D9534F]">*</span>
                        </div>
                        <input
                            name="email"
                            type="email"
                            placeholder="name@higherground.org"
                            required
                            className="bg-[#F3F3F5] py-2 rounded-xl px-3 invalid:border-red-500 focus:outline-[#E76C82] focus:shadow-[0px_4px_20px_0px_rgba(231,108,130,_0.25)]"
                            onChange={handleChange}
                            onBlur={blurHandlerEmail}
                        />
                        {isEmailBlur && !isEmailValid && (
                            <span className="flex items-center text-[#D9534F]">
                                {" "}
                                <Icon.AlertCircle className="w-4 h-4 mr-1 stroke-2" />{" "}
                                {emailError}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                            <div className="space-x-1">
                                <label>Temporary Code</label>
                                <span className="text-[#D9534F]">*</span>
                            </div>
                            <div>
                                <button
                                    className="hover:cursor-pointer"
                                    onClick={togglePopup}
                                >
                                    <Icon.AlertCircle className="w-3.5 h-3.5 stroke-2" />
                                </button>
                            </div>
                            {tempCodePopup && (
                                <div
                                    className="fixed bg-black/30 min-h-screen z-10 w-screen flex justify-center items-center top-0 left-0"
                                    onClick={togglePopup}
                                >
                                    <div className="bg-white max-w-sm p-4 border border-[#DBEAFE] rounded-3xl">
                                        <p className="text-center">
                                            The temporary code was sent to your
                                            email along with the invitation link
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            name="tempCode"
                            type="text"
                            placeholder="750WEFT"
                            required
                            className="bg-[#F3F3F5] py-2 rounded-xl px-3 focus:outline-[#E76C82] focus:shadow-[0px_4px_20px_0px_rgba(231,108,130,_0.25)]"
                            onChange={handleChange}
                            onBlur={blurHandlerTempCode}
                        />
                        {isTempCodeBlur && !isTempCodeValid && (
                            <span className="flex items-center text-[#D9534F]">
                                {" "}
                                <Icon.AlertCircle className="w-4 h-4 mr-1 stroke-2" />{" "}
                                {tempCodeError}
                            </span>
                        )}
                    </div>
                    <button
                        disabled={!isFormComplete || isSubmitting}
                        type="submit"
                        className="flex py-2.5 w-full rounded-xl text-white justify-center bg-[#E76C82] space-x-1 hover:cursor-pointer disabled:bg-[#E59AA8] disabled:text-white disabled:cursor-not-allowed hover:bg-[#e05a74]"
                    >
                        <p>{isSubmitting ? "Verifying..." : "Continue"}</p>
                        {!isSubmitting && <Icon.ArrowRight className="stroke-2" />}
                    </button>
                </form>
            </div>
        </main>
    );
}
