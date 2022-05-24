const lightCol = "#b57865";
const darkCol = "#875444";
module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        ecom_blue: {
          light: lightCol,
          DEFAULT: darkCol,
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
