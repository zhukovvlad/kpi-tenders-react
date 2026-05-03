import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Сгенерированные shadcn/ui примитивы и AuthContext объединяют helper-варианты
  // и React-компоненты в одном файле — это нормально для read-only вендорного слоя.
  // Правило react-refresh/only-export-components отключено для них, поскольку
  // ограничивает Fast Refresh, а не корректность. AuthContext исторически
  // экспортирует и контекст, и провайдер.
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/context/AuthContext.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
