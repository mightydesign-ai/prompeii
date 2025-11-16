/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",               // admin.html, index.html, login.html, etc.
    "./*.js",                 // admin.js, modal.js, login.js, etc.
    "./src/**/*.{html,js}",   // anything inside src/
    "./public/**/*.html"      // any rendered HTML in public
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
