import { getAllData } from "@/lib/getAllData";


export default async function D3VanshDemo() {
    const data = await getAllData();
    console.log(data);
    return (
        <h1 className="text-2xl ml-4 mt-4">Hi</h1>
        
    )
} 