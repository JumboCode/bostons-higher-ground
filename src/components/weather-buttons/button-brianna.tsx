"use client";
import { useState } from "react";

type WeatherButtonProps = {
    label?: string;
};

export default function WeatherButton({ label = "Get Weather" }: WeatherButtonProps) {
    const [temperature, setTemperature] = useState<number | null>(null);
    const[status, setStatus] = useState<string | null>(null);

    const handleClick = async () => {
    try {
        const response = await fetch("https://api.weather.gov/gridpoints/BOX/69,92/forecast");
        if (!response.ok) {
            throw new Error('Error: Status: ${response.status}');
        }

        const data = await response.json();
        const current = data.properties?.periods?.[0];

        if (current) {
            setTemperature(current.temperature);
            setStatus(current.shortForecast);
        } else {
            setTemperature(null);
            setStatus("Forecast Data Unavailable.");
        }
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        setTemperature(null);
        setStatus("Failed to fetch weather data.");
    }
    };

return (
    <div className="flex flex-col items-center gap-4">
        <button
            onClick={handleClick}
            className="px-4 py-2 border-4 border-purple-500 bg-yellow-300 text-purple-500 
            font-semibold rounded-lg hover:bg-orange-500 hover:text-black hover:border-black
            transition-colors duration-200"
            >
                {label}
            </button>

        {status && (
            <div className="text-center text-black text-lg">
            {temperature !== null && (
                <p>Current Temperature: <span className="font-semi-bold">{temperature} Degrees Fahrenheit</span></p>)}
                <p>Weather Status: <span className="font-semi-bold">{status}</span></p>
                </div>
            )}
        </div>
    );
}
