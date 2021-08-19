import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  define: {
    'process.env.BLUEPRINT_NAMESPACE': '""',
    'process.env.REACT_APP_BLUEPRINT_NAMESPACE': '""',
  },
})
