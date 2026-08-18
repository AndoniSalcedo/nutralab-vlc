import nextConfig from 'eslint-config-next';

const eslintConfig = nextConfig.map((config) => {
  if (config.rules) {
    return {
      ...config,
      rules: {
        ...config.rules,
        'no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_'
          }
        ],
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/set-state-in-render': 'off',
        'react-hooks/purity': 'off',
        'react-hooks/preserve-manual-memoization': 'off',
        'react-hooks/immutability': 'off',
        'react-hooks/static-components': 'off',
        'react-hooks/use-memo': 'off'
      }
    };
  }
  return config;
});

export default eslintConfig;
