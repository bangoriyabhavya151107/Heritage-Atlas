/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sandstone: "#F4EBDD",
        terracotta: "#C65D3B",
        "terracotta-ink": "#8F3924",
        indigo: "#1F2A5A",
        ink: "#1B1B1F",
        paper: "#FFFDF9",
        line: "#DDD3C3",
        muted: "#625E58",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "Arial", "sans-serif"],
      },
      boxShadow: {
        folio: "0 24px 70px rgba(31, 42, 90, 0.10)",
      },
    },
  },
  plugins: [],
};
