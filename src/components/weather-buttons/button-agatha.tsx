"use client";
import { useState } from 'react';

export default function WeatherButton({label}:{label:string}) {
    const [weather, setWeather] = useState("");
    const [isVisisble, setVisible] = useState(false);

    const handleClick = () => {
        if(isVisisble) {
            setVisible(false);
            return;
        }

        fetch("https://api.weather.gov/gridpoints/BOX/69,92/forecast")
            .then((res) => res.json())
            .then((json) => {
                const forecast = json.properties.periods[0].detailedForecast
                setWeather(forecast);
                setVisible(true);
            });
    };

    return (
        <>
            <button onClick={handleClick} className="bg-[#8ab846ff] hover:bg-[#689820] text-white font-bold py-2 px-4 rounded-xl font-mono text-lg">
                    {label}
            </button>

            <div className='h-20 flex items-center justify-center'>
                {isVisisble && (
                    <p className="bg-[#f3f4f6] text-gray-800 font-mono text-sm px-4 py-2 rounded-lg shadow-md max-w-md text-center">
                        {weather}
                    </p>
                )}
            </div>
            
        </>
    )
}
