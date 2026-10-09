import type { Theme } from './theme'

export type Template = { name: string; theme: Theme }

export const TEMPLATES: Template[] = [
  {
    name: 'Minimal',
    theme: { bgType: 'color', bgColor: '#f5f5f4', bgGradient: ['#f5f5f4', '#e7e5e4', 180], bgImage: '', textColor: '#1c1917', font: 'Inter', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#1c1917', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Noche',
    theme: { bgType: 'color', bgColor: '#0f0f12', bgGradient: ['#0f0f12', '#1f1f2b', 180], bgImage: '', textColor: '#f4f4f5', font: 'Space Grotesk', buttonStyle: 'outline', buttonShape: 'pill', buttonColor: '#f4f4f5', buttonTextColor: '#0f0f12' },
  },
  {
    name: 'Atardecer',
    theme: { bgType: 'gradient', bgColor: '#ff7e5f', bgGradient: ['#ff7e5f', '#7b2ff7', 160], bgImage: '', textColor: '#ffffff', font: 'Poppins', buttonStyle: 'filled', buttonShape: 'pill', buttonColor: '#ffffff', buttonTextColor: '#5b21b6' },
  },
  {
    name: 'Pastel',
    theme: { bgType: 'gradient', bgColor: '#fde2e4', bgGradient: ['#fde2e4', '#cde7f0', 135], bgImage: '', textColor: '#3f3d56', font: 'Nunito', buttonStyle: 'soft', buttonShape: 'pill', buttonColor: '#8b7fd6', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Neón',
    theme: { bgType: 'color', bgColor: '#0a0a0a', bgGradient: ['#0a0a0a', '#111827', 180], bgImage: '', textColor: '#a3ff12', font: 'Bebas Neue', buttonStyle: 'outline', buttonShape: 'square', buttonColor: '#a3ff12', buttonTextColor: '#0a0a0a' },
  },
  {
    name: 'Natural',
    theme: { bgType: 'color', bgColor: '#eef0e5', bgGradient: ['#eef0e5', '#d9dfc8', 180], bgImage: '', textColor: '#2f3e2c', font: 'Lora', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#4f6f52', buttonTextColor: '#f6f7ef' },
  },
  {
    name: 'Corporativo',
    theme: { bgType: 'gradient', bgColor: '#0b3d91', bgGradient: ['#0b3d91', '#1e6fd9', 180], bgImage: '', textColor: '#ffffff', font: 'Montserrat', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#ffffff', buttonTextColor: '#0b3d91' },
  },
  {
    name: 'Café',
    theme: { bgType: 'color', bgColor: '#f3e9dc', bgGradient: ['#f3e9dc', '#e6d2b5', 180], bgImage: '', textColor: '#4a2c1a', font: 'DM Serif Display', buttonStyle: 'shadow', buttonShape: 'rounded', buttonColor: '#c08552', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Retro',
    theme: { bgType: 'color', bgColor: '#ffd23f', bgGradient: ['#ffd23f', '#ee4266', 180], bgImage: '', textColor: '#1a1a1a', font: 'Space Grotesk', buttonStyle: 'shadow', buttonShape: 'square', buttonColor: '#ffffff', buttonTextColor: '#1a1a1a' },
  },
  {
    name: 'Playa',
    theme: { bgType: 'gradient', bgColor: '#43cea2', bgGradient: ['#43cea2', '#185a9d', 200], bgImage: '', textColor: '#ffffff', font: 'Pacifico', buttonStyle: 'soft', buttonShape: 'pill', buttonColor: '#ffffff', buttonTextColor: '#185a9d' },
  },
  {
    name: 'Oro negro',
    theme: { bgType: 'color', bgColor: '#111111', bgGradient: ['#111111', '#2a2418', 180], bgImage: '', textColor: '#e9d8a6', font: 'Cormorant Garamond', buttonStyle: 'outline', buttonShape: 'square', buttonColor: '#d4af37', buttonTextColor: '#111111' },
  },
  {
    name: 'Lavanda',
    theme: { bgType: 'gradient', bgColor: '#e9e4f7', bgGradient: ['#f3effc', '#d9cff3', 180], bgImage: '', textColor: '#3b2f63', font: 'Quicksand', buttonStyle: 'filled', buttonShape: 'pill', buttonColor: '#7c6bc4', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Menta',
    theme: { bgType: 'color', bgColor: '#e3f6ef', bgGradient: ['#e3f6ef', '#c5ece0', 180], bgImage: '', textColor: '#14463a', font: 'Outfit', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#1f8a70', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Rosa chicle',
    theme: { bgType: 'gradient', bgColor: '#ff9a9e', bgGradient: ['#ff9a9e', '#fecfef', 160], bgImage: '', textColor: '#5c1a3a', font: 'Fredoka', buttonStyle: 'filled', buttonShape: 'pill', buttonColor: '#ffffff', buttonTextColor: '#c2185b' },
  },
  {
    name: 'Océano',
    theme: { bgType: 'gradient', bgColor: '#0f2027', bgGradient: ['#0f2027', '#2c5364', 180], bgImage: '', textColor: '#e0f2f1', font: 'Manrope', buttonStyle: 'soft', buttonShape: 'rounded', buttonColor: '#4dd0e1', buttonTextColor: '#0f2027' },
  },
  {
    name: 'Bosque',
    theme: { bgType: 'color', bgColor: '#1b2e24', bgGradient: ['#1b2e24', '#2d4a3a', 180], bgImage: '', textColor: '#e8efe4', font: 'Merriweather', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#a7c4a0', buttonTextColor: '#1b2e24' },
  },
  {
    name: 'Terracota',
    theme: { bgType: 'color', bgColor: '#f4e4d7', bgGradient: ['#f4e4d7', '#e8c9b0', 180], bgImage: '', textColor: '#5a2e1b', font: 'Josefin Sans', buttonStyle: 'filled', buttonShape: 'square', buttonColor: '#c1653f', buttonTextColor: '#fff7f0' },
  },
  {
    name: 'Monocromo',
    theme: { bgType: 'color', bgColor: '#ffffff', bgGradient: ['#ffffff', '#f0f0f0', 180], bgImage: '', textColor: '#000000', font: 'Archivo Black', buttonStyle: 'outline', buttonShape: 'square', buttonColor: '#000000', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Sakura',
    theme: { bgType: 'color', bgColor: '#fff1f3', bgGradient: ['#fff1f3', '#ffe0e6', 180], bgImage: '', textColor: '#7a2e44', font: 'Dancing Script', buttonStyle: 'soft', buttonShape: 'pill', buttonColor: '#e8879c', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Medianoche',
    theme: { bgType: 'gradient', bgColor: '#141e30', bgGradient: ['#141e30', '#243b55', 160], bgImage: '', textColor: '#ffffff', font: 'Raleway', buttonStyle: 'filled', buttonShape: 'pill', buttonColor: '#f5c26b', buttonTextColor: '#141e30' },
  },
  {
    name: 'Fuego',
    theme: { bgType: 'gradient', bgColor: '#f12711', bgGradient: ['#f12711', '#f5af19', 150], bgImage: '', textColor: '#ffffff', font: 'Anton', buttonStyle: 'filled', buttonShape: 'square', buttonColor: '#1a1a1a', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Belleza',
    theme: { bgType: 'color', bgColor: '#f7ede8', bgGradient: ['#f7ede8', '#efd9cf', 180], bgImage: '', textColor: '#6b4a3e', font: 'Playfair Display', buttonStyle: 'outline', buttonShape: 'pill', buttonColor: '#b07d6b', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Barbería',
    theme: { bgType: 'color', bgColor: '#1c1c1c', bgGradient: ['#1c1c1c', '#2b2b2b', 180], bgImage: '', textColor: '#f2e8d5', font: 'Oswald', buttonStyle: 'shadow', buttonShape: 'square', buttonColor: '#f2e8d5', buttonTextColor: '#1c1c1c' },
  },
  {
    name: 'Spa',
    theme: { bgType: 'gradient', bgColor: '#e8efe9', bgGradient: ['#f4f7f2', '#dce6dd', 180], bgImage: '', textColor: '#3d4f44', font: 'Cormorant Garamond', buttonStyle: 'soft', buttonShape: 'pill', buttonColor: '#7d9b86', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Fitness',
    theme: { bgType: 'color', bgColor: '#0d0d0d', bgGradient: ['#0d0d0d', '#1f1f1f', 180], bgImage: '', textColor: '#ffffff', font: 'Bebas Neue', buttonStyle: 'filled', buttonShape: 'square', buttonColor: '#e63946', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Tropical',
    theme: { bgType: 'gradient', bgColor: '#f7971e', bgGradient: ['#ffd200', '#f7971e', 180], bgImage: '', textColor: '#3a1f00', font: 'Righteous', buttonStyle: 'shadow', buttonShape: 'pill', buttonColor: '#00a676', buttonTextColor: '#ffffff' },
  },
  {
    name: 'Cielo',
    theme: { bgType: 'gradient', bgColor: '#a1c4fd', bgGradient: ['#a1c4fd', '#c2e9fb', 180], bgImage: '', textColor: '#1d3557', font: 'Comfortaa', buttonStyle: 'filled', buttonShape: 'rounded', buttonColor: '#ffffff', buttonTextColor: '#1d3557' },
  },
  {
    name: 'Pizarra',
    theme: { bgType: 'color', bgColor: '#2f3640', bgGradient: ['#2f3640', '#353b48', 180], bgImage: '', textColor: '#f5f6fa', font: 'Caveat', buttonStyle: 'outline', buttonShape: 'rounded', buttonColor: '#f5f6fa', buttonTextColor: '#2f3640' },
  },
  {
    name: 'Vintage',
    theme: { bgType: 'color', bgColor: '#efe6d2', bgGradient: ['#efe6d2', '#e2d4b7', 180], bgImage: '', textColor: '#3e2f1c', font: 'Abril Fatface', buttonStyle: 'shadow', buttonShape: 'rounded', buttonColor: '#d96c4e', buttonTextColor: '#fff8ee' },
  },
  {
    name: 'Tech',
    theme: { bgType: 'gradient', bgColor: '#0f0c29', bgGradient: ['#0f0c29', '#302b63', 160], bgImage: '', textColor: '#e0e7ff', font: 'Syne', buttonStyle: 'soft', buttonShape: 'rounded', buttonColor: '#818cf8', buttonTextColor: '#0f0c29' },
  },
]
