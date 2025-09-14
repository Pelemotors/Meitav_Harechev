# מיטב הרכב - סוכנות הרכב של חדרה

אתר אינטרנט מודרני לסוכנות הרכב "מיטב הרכב" בחדרה.

## אודות הפרויקט

מיטב הרכב היא סוכנות פרטית בחדרה שמאמינה שכל אחד צריך למצוא את הרכב שמתאים לו – גם לתקציב וגם לאורח החיים.

### תכונות האתר:
- חיפוש מתקדם לרכבים עם סליידרים אינטואיטיביים
- מחשבון מימון רכב
- ניהול מלאי מתקדם
- מערכת ניהול לידים
- אינטגרציה עם WhatsApp
- ממשק ניהול למנהלים

## טכנולוגיות

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database & Storage)
- Lucide React (Icons)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
