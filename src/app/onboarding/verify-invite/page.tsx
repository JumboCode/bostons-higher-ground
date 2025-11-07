export default function Page() {
    return (
        <main className="flex flex-1 flex-col justify-center items-center">
                <div className="flex flex-col">
                    <p className="text-center text-3xl font-bold">Welcome</p>
                    <p className="text-center text-base font-extralight">Create your account to get started</p>
                </div>
                <div className="flex flex-col border-1 border-amber-500">
                    <p className="">Verify your information</p>
                </div>
        </main>
    );
}