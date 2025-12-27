/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'maint-green': '#D1FAE5',
                'maint-blue': '#DBEAFE',
                'maint-red': '#FEE2E2',
                'maint-yellow': '#FEF3C7',
            },
            boxShadow: {
                'sketch': '4px 4px 0px 0px rgba(0,0,0,0.1)',
                'sketch-hover': '6px 6px 0px 0px rgba(0,0,0,0.15)',
            },
            fontFamily: {
                'outfit': ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
