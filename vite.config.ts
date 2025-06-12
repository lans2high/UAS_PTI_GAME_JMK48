import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["cf8w8r-5173.csb.app"],
    allowedHosts: ["cf8w8r-5175.csb.app"],
    allowedHosts: ["ffqtmq-5173.csb.app"],
  },
});
