/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary
                pink: "#F76C82",
                yellow: "#F5C86A",

                // Neutrals
                "dark-gray": "#555555",
                gray: "#D9D9D9",
                "light-gray": "#EBEBEB",

                // Accents
                "soft-pink": "#DE8F9C",
                mint: "#85CFCA",
                "soft-yellow": "#FDE19D",
                purple: "#B96FB6",

                "light-pink": "#FFEAE8",
                "light-mint": "#E0F7F4",
                "light-yellow": "#FFF8E9",
                "light-purple": "#F0E7ED",

                // Status
                error: "#D9534F",
                success: "#4CAF50",
            },
            fontFamily: {
                poppins: ["Poppins", "sans-serif"],
                manrope: ["Manrope", "sans-serif"],
            },
            fontSize: {
                h1: ["28px", { fontWeight: "700" }], // Poppins Bold
                h2: ["20px", { fontWeight: "600" }], // Poppins SemiBold
                kpi: ["36px", { fontWeight: "700" }], // Poppins Bold
                body: ["16px", { fontWeight: "400" }],
                label: ["14px", { fontWeight: "500" }],
                small: ["12px", { fontWeight: "400" }],
            },
            spacing: {
                1: "8px",
                2: "16px",
                3: "24px",
                4: "32px",
                5: "40px",
                6: "48px",
            },
        },
    },
    plugins: [],
};
