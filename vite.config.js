import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/calendar-flashcard/",   // MUST MATCH YOUR REPO NAME EXACTLY
  build: {
    outDir: "docs",
  },
});
