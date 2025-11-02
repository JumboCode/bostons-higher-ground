 //Tells Next.js this file runs in the browser (not the server). (need it for user clicks)
"use client";

//Brings in the React hook that lets us store and update values inside the component
import { useState } from "react";

//defining the information we'll get from the API
type WeatherInfo = {
    temperature: number;
    temperatureUnit: string;
    shortForecast: string;
};

//defining the props
type WeatherButtonProps = {
  label: string; //prop has one value with type String
};

function getWeatherColor(shortForecast: string) {
  const f = shortForecast.toLowerCase();

  if (f.includes("sun") || f.includes("clear")) {
    return {
      bg: "bg-amber-50",
      hover: "hover:bg-yellow-200",
      text: "text-amber-900"
    };
  }

  if (f.includes("cloud")) {
    return {
      bg: "bg-gray-100",
      hover: "hover:bg-gray-300",
      text: "text-gray-700"
    };
  }

  if (f.includes("rain") || f.includes("showers")) {
    return {
      bg: "bg-blue-50",
      hover: "hover:bg-blue-200",
      text: "text-blue-900"
    };
  }

  if (f.includes("snow")) {
    return {
      bg: "bg-slate-50",
      hover: "hover:bg-blue-100",
      text: "text-slate-800"
    };
  }

  // default / fallback
  return {
    bg: "bg-neutral-100",
    hover: "hover:bg-neutral-200",
    text: "text-neutral-800"
  };
}


//defining the component
export default function WeatherButton({label}: WeatherButtonProps) {
    //creating a varible called loading for when waiting to fetch the forecast
    //setLoading says if its loading or not
    const [loading, setLoading] = useState(false);
    //storing the weather data from the API
    //at first it is null, then becomes the weatherInfo prop's values
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    //error message if something is wrong
    const [error, setError] = useState<string | null>(null);

    //async funtion because it will do something that takes time, so don't freeze the page while waiting.
    async function handleClick() {
        //We're getting the data so the button is loading
        setLoading(true);
        //we haven't encountured any errors so it is null
        setError(null);
        //we're waiting for the forecast so the weather is null
        setWeather(null);

        try {
            // creates a new variable called response that will hold the API's response
            const response = await fetch("https://api.weather.gov/gridpoints/BOX/69,92/forecast", //await: Pause here until the fetch request finishes — but don’t freeze the UI
                //option object for fetch specifying metadata about the request
                {headers : {Accept : "application/geo+json"}}
                //headers tells what type of response we want
                // GeoJSON = JSON designed for geographic data
            );

            //handle error
            if ( !response.ok){
                throw new Error("failled to fetch the API");
            }

            //defining the variable that gets the data we fetched
            const data = await response.json();

            //Access the first forecast period, ?. prevents crashing if something is missing
            const firstPeriod = data.properties?.periods?.[0];

            //if fails 
            if(!firstPeriod){
                throw new Error("invalid forecast data");
            }

            //creating the extracted varible in weather info type that contains extracted info
            const extracted: WeatherInfo = {
                temperature: firstPeriod.temperature,
                temperatureUnit: firstPeriod.temperatureUnit,
                shortForecast: firstPeriod.shortForecast,
            };

            //making the weather extracted
            setWeather(extracted);
            //showing on backend the extracted data
            console.log("Weather data:", extracted);

        } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Something went wrong");
        }
        } finally {
        setLoading(false);
        }

    }

    return (
        <div className="space-y-2">

            <button
            onClick= {handleClick}
            disabled={loading}
            className="
                px-4 py-2 
                border border-neutral-300 
                rounded-md 
                text-black 
                font-medium 
                bg-white 
                hover:bg-blue-800 
                hover:border-blue-200
                hover:text-blue-50
                hover:font-bold
                transition-colors duration-200
            ">
                { loading ? "loading..." : label }
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {weather && (() => {
                const { bg, hover, text } = getWeatherColor(weather.shortForecast);
                return (
                    <div className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer ${bg} ${hover} ${text}`}>
                    <p>
                        <strong>Temp:</strong> {weather.temperature}°                            {weather.temperatureUnit}
                    </p>
                    <p>
                        <strong>Forecast:</strong> {weather.shortForecast}
                    </p>
                    </div>
                );
            })()}
        </div>
    );
}
