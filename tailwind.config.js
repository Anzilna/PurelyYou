/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs",
    
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto', 'sans'], 
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}