const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");

module.exports = [
  {
    files: ["src/**/*.ts"],
    ignores: ["lib/**/*", "dist/**/*", "node_modules/**/*"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [
          "tsconfig.json",
          "tsconfig.dev.json",
        ],
      },
      ecmaVersion: 2022,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    rules: {
      "quotes": ["error", "double"],
      "import/no-unresolved": "off",
      "indent": "off",
      "object-curly-spacing": ["error", "always"],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        {
          "ignoreConditionalTests": true,
          "ignoreMixedLogicalExpressions": true,
          "ignorePrimitives": true,
        },
      ],
      "operator-linebreak": "off",
      "valid-jsdoc": "off",
      "max-len": [
        "error",
        {
          code: 80,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      "func-style": ["error", "expression", { allowArrowFunctions: true }],
      "eqeqeq": ["error", "always"],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: true,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        }
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
];