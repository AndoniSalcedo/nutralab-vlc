import nextConfig from 'eslint-config-next';
import importX from 'eslint-plugin-import-x';

const eslintConfig = [
  ...nextConfig.map((config) => {
    if (config.rules) {
      return {
        ...config,
        rules: {
          ...config.rules,
          'no-undef': 'error',
          'no-unused-vars': 'error',
          'react-hooks/set-state-in-effect': 'off',
          'react-hooks/set-state-in-render': 'off',
          'react-hooks/purity': 'off',
          'react-hooks/preserve-manual-memoization': 'off',
          'react-hooks/immutability': 'off',
          'react-hooks/static-components': 'off',
          'react-hooks/use-memo': 'off',
          'react-hooks/incompatible-library': 'off',
          '@next/next/no-img-element': 'off'
        }
      };
    }
    return config;
  }),
  {
    plugins: {
      'import-x': importX
    },
    settings: {
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs'],
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json']
        },
        typescript: {
          alwaysTryTypes: true,
          project: './jsconfig.json'
        }
      }
    },
    rules: {
      'import-x/no-unused-modules': [
        'warn',
        {
          unusedExports: true,
          ignoreExports: [
            'app/**/page.*',
            'app/**/layout.*',
            'app/**/loading.*',
            'app/**/route.*',
            '*.config.mjs',
            'scripts/**'
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
