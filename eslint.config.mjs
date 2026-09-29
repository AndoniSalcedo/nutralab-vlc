import nextConfig from 'eslint-config-next';
import importX from 'eslint-plugin-import-x';

const BUTTON_COMPONENTS = new Set([
  'button',
  'Button',
  'ActionIcon',
  'UnstyledButton',
  'Accordion.Control',
  'Tabs.Tab',
]);

const LINK_COMPONENTS = new Set([
  'a',
  'Link',
  'Anchor',
  'NavLink',
]);

function getElementName(node) {
  if (!node || !node.openingElement) return '';
  const opening = node.openingElement;
  if (!opening.name) return '';
  if (opening.name.type === 'JSXIdentifier') return opening.name.name;
  if (opening.name.type === 'JSXMemberExpression') {
    const obj = opening.name.object ? opening.name.object.name : '';
    const prop = opening.name.property ? opening.name.property.name : '';
    return `${obj}.${prop}`;
  }
  return '';
}

function getRenderedTag(node) {
  const name = getElementName(node);
  const isButton = BUTTON_COMPONENTS.has(name);
  const isLink = LINK_COMPONENTS.has(name);
  if (!isButton && !isLink) return null;

  const opening = node.openingElement;
  const compAttr = opening.attributes?.find(
    (a) => a.type === 'JSXAttribute' && a.name?.name === 'component'
  );

  if (compAttr && compAttr.value) {
    if (compAttr.value.type === 'Literal') {
      const val = compAttr.value.value;
      if (val === 'div' || val === 'span') return 'safe-wrapper';
      if (val === 'a') return 'a';
      if (val === 'button') return 'button';
    } else if (compAttr.value.type === 'JSXExpressionContainer') {
      const expr = compAttr.value.expression;
      if (expr && expr.type === 'Identifier' && expr.name === 'Link') {
        return 'a';
      }
    }
  }

  return isButton ? 'button' : 'a';
}

const localPlugin = {
  rules: {
    'no-invalid-dom-nesting': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow invalid HTML DOM nesting like buttons or links inside buttons or links',
        },
        schema: [],
        messages: {
          invalidNesting:
            'Invalid DOM nesting: <{{ child }}> renders <{{ childTag }}> inside <{{ parent }}> (which renders <{{ parentTag }}>). In HTML, this causes hydration errors and broken interactions.',
        },
      },
      create(context) {
        return {
          JSXElement(node) {
            const currentTag = getRenderedTag(node);
            if (!currentTag || currentTag === 'safe-wrapper') return;

            let parent = node.parent;
            while (parent) {
              if (parent.type === 'JSXElement') {
                const parentTag = getRenderedTag(parent);
                if (parentTag && parentTag !== 'safe-wrapper') {
                  const childName = getElementName(node);
                  const parentName = getElementName(parent);
                  context.report({
                    node: node.openingElement,
                    messageId: 'invalidNesting',
                    data: {
                      child: childName,
                      childTag: currentTag,
                      parent: parentName,
                      parentTag: parentTag,
                    },
                  });
                  break;
                }
              }
              parent = parent.parent;
            }
          },
        };
      },
    },
  },
};

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
          '@next/next/no-img-element': 'off',
        },
      };
    }
    return config;
  }),
  {
    plugins: {
      local: localPlugin,
      'import-x': importX,
    },
    settings: {
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs'],
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './jsconfig.json',
        },
      },
    },
    rules: {
      'local/no-invalid-dom-nesting': 'error',
      'import-x/no-unused-modules': [
        'error',
        {
          unusedExports: true,
          ignoreExports: [
            'app/**/page.*',
            'app/**/layout.*',
            'app/**/loading.*',
            'app/**/not-found.*',
            'app/**/error.*',
            'app/**/global-error.*',
            'app/**/route.*',
            '*.config.mjs',
            'scripts/**',
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
