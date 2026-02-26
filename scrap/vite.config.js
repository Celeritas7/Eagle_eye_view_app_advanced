import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change 'eagle-eye-v2' to your GitHub repo name
  base: '/Eagle_eye_view_app_advanced/',
});
