import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

const background = { background: '#ebf7f2' }

export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: background },
    apple: { ...preset.apple, padding: 0, resizeOptions: background },
  },
  images: ['public/icon.svg'],
})
