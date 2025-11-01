"use client"

import React, { useState } from 'react';

interface WeatherButtonProps {
    label?: string; 
}

const WeatherButton: React.FC<WeatherButtonProps> = ({ label }) => {
    
    const [weatherInfo, setWeatherInfo] = useState<string>(''); 

    const handleClick = async () => {

        const weatherUrl = 'https://api.weather.gov/gridpoints/BOX/69,92/forecast';

        try {

            const response = await fetch(weatherUrl);
            const data = await response.json();

            const currentForecast = data.properties.periods[0];
            
            const temp = currentForecast.temperature;
            const status = currentForecast.shortForecast;

            console.log('--- Final Required Data ---');
            console.log(`Current Temperature: ${temp}°F`);
            console.log(`Weather Status: ${status}`)
            
           setWeatherInfo(`Current Temp: ${temp}°F | Status: ${status}`);

        } catch (error) {
        /* error*/
        }
    };
    
    return (
        <div>
            <button 

                onClick={handleClick} 
                className="bg-gray-900 text-white py-2 px-4 rounded-lg shadow-md"
            >
                {label} {}
            </button>
            
            {/* Display the weatherInfo state below the button */}
            <p className="mt-2 text-sm text-gray-700">
                {weatherInfo}
            </p>
        </div>
    );
};

export default WeatherButton;