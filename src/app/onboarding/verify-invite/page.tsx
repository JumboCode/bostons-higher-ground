import * as Icon from "feather-icons-react"

enum Fields {
    TEXT = 'text',
}

interface InvitationFormFields {
    component: string;
    label: string;
    type: string;
    id: string;
}

const formFields: InvitationFormFields[] = [
    {
        component: 'text',
        label: 'Email Address',
        type: 'email',
        id: 'emailAddress'
    },
    {
        component: 'text',
        label: 'Temporary Code',
        type: 'text',
        id: 'tempCode'
    }
]

interface IProps {
    field: InvitationFormFields;
    value: string;
    onFieldChange: (fieldName: string, value: string) => void;
}

export default function Page(props: IProps) {
    const {field} = props;
    return (
        <main className="flex flex-1 flex-col justify-center items-center space-y-5">
                <div className="flex flex-col px-16">
                    <p className="text-center text-3xl font-bold">Welcome</p>
                    <p className="text-center text-base font-extralight">Create your account to get started</p>
                </div>
                <div className="flex flex-col border-0 p-8 rounded-3xl bg-white space-y-8 shadow-[0px_24px_50px_0px_rgba(167,_74,_91,_0.2)] max-w-[400px]">
                    <p className="text-2xl font-semibold px-5">Verify your information</p>
                    <form className="w-full max-w-sm">
                        <div className="">
                            <label className="" htmlFor="email-address">
                                Email Address
                            </label>
                            </div>
                            <div className="">
                            <input className="mt-2 bg-[#F3F3F5] border-1 border-[#F3F3F5] appearance-none rounded-2xl w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-[#F3F3F5] focus:border-[#E76C82]" id="email" type="email" placeholder="name@higherground.org"/>
                        </div>
                        <div className="mt-4">
                            <div className="">
                                <label className="" htmlFor="temporary-code">
                                    Temporary Code
                                </label>
                                </div>
                                <div className="">
                                <input className="mt-2 bg-[#F3F3F5] border-1 border-[#F3F3F5] appearance-none rounded-2xl w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-[#F3F3F5] focus:border-[#E76C82]" id="temp-code" type="text" placeholder="750WEFT" />
                            </div>
                        </div>
                        <div className="mt-5">
                            <button className="space-x-1 justify-center items-center flex flex-row w-full bg-[#E76C82] hover:bg-[#E75971] focus:shadow-outline focus:outline-none text-white font-medium py-3 px-4 rounded-xl hover:cursor-pointer" type="button">
                                <p className="text-base">Continue</p>
                                <Icon.ArrowRight className="stroke-2 max-h-5"/>
                            </button>
                        </div>
                    </form>

                    
                    {/* <div>
                        <div className="Email">
                            <p className="text-base">Email Address</p>
                        </div>
                        <div className="Temp_code">
                            <p className="text-base">Temporary code</p>
                        </div>
                        <button className="flex flex-row bg-[#E76C82] text-white items-center justify-center py-2.5 w-full rounded-xl space-x-1">
                            <p className="text-base">Continue</p>
                            <Icon.ArrowRight className="stroke-1.5 max-h-5"/>
                        </button>
                    </div> */}
                </div>
        </main>
    );
}