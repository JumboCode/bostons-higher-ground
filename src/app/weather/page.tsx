import {default as KaiWeatherButton} from "@/components/weather-buttons/button-kai";
import {default as AgathaWeatherButton} from "@/components/weather-buttons/button-agatha";
import {default as AaditWeatherButton} from "@/components/weather-buttons/button-aadit";
import {default as AnsonWeatherButton} from "@/components/weather-buttons/button-anson";
import {default as BriannaWeatherButton} from "@/components/weather-buttons/button-brianna";
import {default as GeorgeWeatherButton} from "@/components/weather-buttons/button-george";
import {default as HandeWeatherButton} from "@/components/weather-buttons/button-hande";
import {default as KristyWeatherButton} from "@/components/weather-buttons/button-kristy";
import {default as VanshWeatherButton} from "@/components/weather-buttons/button-vansh";
import {default as WestWeatherButton} from "@/components/weather-buttons/button-west";

export default function Page() {
    return (
        <main className="w-screen h-screen flex flex-col justify-center items-center gap-5">
            <VanshWeatherButton label="Get Weather"/>
        </main>
    );
}
