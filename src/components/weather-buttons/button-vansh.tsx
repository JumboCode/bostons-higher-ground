'use client'
import { useEffect, useState } from "react";

interface WeatherItem {
    temperature: number
    temperatureUnit: string
    shortForecast: string
}   

export default function WeatherButton({ label }: { label: string } ) {
    const [event, setEvent] = useState<WeatherItem | null>(null)
    
    const handleClick = () => {
        fetch('https://api.weather.gov/gridpoints/BOX/69,92/forecast')
        .then(response => response.json())
        .then(forecast => forecast.properties.periods[0])
        .then(current => setEvent(
            {
                temperature: current.temperature,
                temperatureUnit: current.temperatureUnit,
                shortForecast: current.shortForecast,
            })
        );
    }
    
    return <div>
                <button onClick={handleClick} className="py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white transition-colors">{label}</button>
                { event && (
                    <div className="mt-2 ml-2.5">    
                        <p className="text-3xl font-semibold underline-offset-8 underline mb-1"> { event.temperature }&deg;{ event.temperatureUnit } </p>
                        <p className="text-lg">{event.shortForecast}</p>
                    </div>
                )}
        </div>;

}
