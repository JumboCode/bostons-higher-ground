"use client";

type WeatherProps = {
    label: string
}


export default function WeatherButton(props: WeatherProps) {
    async function handleClick(){
        try {
            const response = await fetch(
                "https://api.weather.gov/gridpoints/BOX/69,92/forecast"
            );
            if (!response.ok){
                throw new Error(`Error: ${response.statusText}` )
            }
            const data = await response.text();
            console.log("Weather data:", data);

        }catch(error){
            console.error("Error", error);
            throw error;
        }
    }

    return <button className="rounded-lg px-8 py-2 border border-black"
    onClick={handleClick}
    >
    {props.label}
    </button>;
    
}



