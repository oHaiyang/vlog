import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  define: {},
  optimizeDeps: {
    exclude: ['electron'], // 告诉 Vite 不要转换 electron 模块
  },
});
