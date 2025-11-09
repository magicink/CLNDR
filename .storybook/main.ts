import type { StorybookConfig } from '@storybook/html-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|js)'],
  addons: ['@storybook/addon-a11y'],
  staticDirs: ['../src/css'],
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  docs: {
    autodocs: true
  }
}

export default config
