"use client"
import Error from 'next/error';
import {useEffect, useState} from 'react';

export default function WeatherButton() {
    // const [count, setCount] = useState(() => {
    //     return 0;
    // });

    // // hook being destroyed, cleaned up and rerun
    // useEffect(() => {
    //     // code to run
    //     console.log("The count is: ", count);

    //     // optional return fulnction
    //     return () => {
    //         console.log("I am being cleaned up")
    //     }
    // }, [count]); // the dependency array

    // function decreaseCount() {
    //     setCount(previous => previous -1)
    // }
    // function increaseCount() {
    //     setCount(previous => previous + 1)
    // }
    const [weather, setWeather] = useState("");
    const [temperature, setTemperature] = useState("");

    async function getWeather() {
        const url = "https://api.weather.gov/gridpoints/BOX/69,92/forecast";
        try {
            const response = await fetch(url)
            console.log("Print pre .json", response);
            const result = await response.json();
            console.log("Result after json:", result);

            const currentPeriod = result.properties.periods[0];
            setWeather(currentPeriod.shortForecast)
            setTemperature(currentPeriod.temperature)
        } catch (error) {
            console.error("Error", error)
        }
    }
    return (
        <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-md">
        <button 
            onClick={getWeather}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 w-full mb-4"
        >
            Get Weather
        </button>
        
        {weather && temperature && (
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-gray-700 text-lg mb-2">
                    <span className="font-semibold">Today's Forecast:</span> {weather}
                </div>
                <div className="text-gray-700 text-lg">
                    <span className="font-semibold">Temperature:</span> {temperature}°F
                </div>
            </div>
        )}

            {/* <button onClick={decreaseCount}>-</button>
            <span>{count}</span>
            <button onClick={increaseCount}>+</button> */}
        </div>
    );
}
