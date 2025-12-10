import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // <--- IMPORT THIS

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- ADD THIS
  ],
  base: "/calendar-flashcard/",
  build: {
    outDir: "docs", // We will build to 'docs' folder for easier deployment
  },
});