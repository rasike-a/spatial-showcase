import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        THREE: "readonly",
        import: "readonly",
        importMeta: "readonly",
        requestAnimationFrame: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly"
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    rules: {
      // Disable console warnings since we use logger utility (allow in logger.js)
      "no-console": ["warn", { allow: ["warn", "error", "debug", "log"] }],
      // Warn about unused variables
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      // Enforce const for variables that are never reassigned
      "prefer-const": "error",
      // Disallow var
      "no-var": "error",
      // Require semicolons
      semi: ["error", "always"],
      // Enforce consistent quotes
      quotes: ["error", "double", { avoidEscape: true }],
      // Enforce consistent spacing
      indent: ["error", 2, { SwitchCase: 1 }],
      // Enforce trailing commas in multiline (allow in objects/arrays)
      "comma-dangle": ["error", "never"],
      // Enforce spacing around operators
      "space-infix-ops": "error",
      // Enforce spacing around keywords
      "keyword-spacing": "error",
      // Enforce spacing in function declarations
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always"
        }
      ],
      // Enforce spacing around braces
      "object-curly-spacing": ["error", "always"],
      // Enforce spacing in arrays
      "array-bracket-spacing": ["error", "never"],
      // Enforce spacing around arrow functions
      "arrow-spacing": "error",
      // Enforce consistent line breaks
      "eol-last": ["error", "always"],
      // Disallow trailing spaces
      "no-trailing-spaces": "error",
      // Enforce max line length
      "max-len": ["warn", { code: 120, ignoreUrls: true, ignoreStrings: true }]
    }
  },
  {
    // Override for files with import assertions (JSON imports)
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        allowImportExportEverywhere: true
      }
    },
    rules: {
      // Disable parsing errors for import assertions
      "no-unused-vars": "off"
    }
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "*.config.js",
      // Files with import assertions (ESLint parser doesn't fully support this syntax yet)
      "src/systems/App.js",
      "src/scenes/AboutScene.js",
      "src/scenes/ArtGalleryScene.js",
      "src/scenes/PhotoScene.js",
      "src/scenes/ProjectsScene.js",
      "src/content/showcaseContent.js"
    ]
  }
];

