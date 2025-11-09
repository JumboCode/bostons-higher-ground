type FormProps = {
    placeholder: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const FormInput = (props : FormProps) => {
    return (
        <div className="">
            <label htmlFor="email">Email Address</label>
            <input type="email" 
                   placeholder={props.placeholder} 
                   className="flex flex-col w-full border" 
                   onChange={(e) => props.setEmail(e.target.value)}
            />
        </div>
    )
}

export default FormInput