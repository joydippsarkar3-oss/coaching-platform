import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1677ff',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}

export default config
