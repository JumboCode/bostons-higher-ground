"use client";
import React, { useState } from "react";

type ButtonProps = {
  label: string;
};

export default function WeatherButton({ label }: ButtonProps) {
  const [weather, setWeather] = useState<string>("");

  async function handleClick() {
    try {
      const response = await fetch("https://api.weather.gov/gridpoints/BOX/69,92/forecast");
      const data = await response.json();

      // Get the first forecast period (current)
      const forecast = data.properties.periods[0];
      const temperature = forecast.temperature;
      const condition = forecast.shortForecast;

      // Update displayed text
      setWeather(`${temperature}°F — ${condition}`);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeather("Failed to fetch weather.");
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3 mt-6">
      <button
        onClick={handleClick}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-full shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 ease-in-out transform hover:scale-105"
      >
        Get Weather
      </button>
  
      {weather && (
        <p className="text-gray-800 text-lg font-medium">
          {weather}
        </p>
      )}
    </div>
  );  
}
