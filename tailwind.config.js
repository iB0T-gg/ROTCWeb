/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.jsx",
    "./resources/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#454B1B',
        textColor: '#DEDEDE',
        sideBarColor: '#FCFCFC',
        backgroundColor: '#E2E2E2',
        sideBarTextColor: '#273240',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

