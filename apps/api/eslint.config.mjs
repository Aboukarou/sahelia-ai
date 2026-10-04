import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["test/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: "./tsconfig.e2e.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
