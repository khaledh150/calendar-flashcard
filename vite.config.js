import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 1. Keep this line exactly as is
  base: "/calendar-flashcard/",
  
  // 2. I REMOVED the "build" section here. 
  // By default, Vite builds to "dist", which matches your package.json.
});