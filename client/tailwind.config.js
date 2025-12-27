/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pastel: {
                    red: '#ffb3ba',
                    blue: '#bae1ff',
                    green: '#baffc9',
                    yellow: '#ffffba',
                    purple: '#e0bbe4',
                    gray: '#f5f5f5',
                }
            },
            fontFamily: {
                sketch: ['"Outfit"', 'sans-serif'], // Or a more sketch-like font if available
            },
            boxShadow: {
                'sketch': '4px 4px 0px 0px rgba(0,0,0,1)',
                'sketch-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
            },
            borderWidth: {
                '3': '3px',
            }
        },
    },
    plugins: [],
}
