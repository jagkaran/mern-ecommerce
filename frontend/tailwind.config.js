const lightCol = "#b57865";
const darkCol = "#875444";
const linkdein = "#0072b1";
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
        linkdein_blue: linkdein,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
