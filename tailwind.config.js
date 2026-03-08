/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'], // For clean body copy
                serif: ['"Playfair Display"', '"Lora"', 'Georgia', 'serif'], // For massive editorial headings
                mono: ['"Space Mono"', 'monospace'], // Brand accent font
            },
            colors: {
                background: '#FFFFFF', // Pure minimalist white
                foreground: '#111111', // Deep charcoal / near black
                primary: {
                    DEFAULT: '#9A8C78', // Soft warm taupe instead of blue or dark green
                    foreground: '#FFFFFF',
                },
                muted: {
                    DEFAULT: '#F8F9FA', // Extremely soft grey for subtle contrast sections
                    foreground: '#666666',
                },
                border: '#EAEAEA',
            },
        },
    },
    plugins: [],
}
