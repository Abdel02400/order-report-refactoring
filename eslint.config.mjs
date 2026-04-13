import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    { ignores: ['node_modules', 'dist', 'legacy'] },
    js.configs.recommended,
    tseslint.configs.recommended,
    prettier,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'prefer-destructuring': ['error', { AssignmentExpression: { array: false } }],
        },
    },
]);
