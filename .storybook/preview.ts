import type { Preview } from '@storybook/html'
import { template as lodashTemplate } from 'lodash-es'

// Expose an underscore-compatible global with only the template function
;(globalThis as any)._ = { template: lodashTemplate }

const preview: Preview = {
  parameters: {
    a11y: {}
  }
}

export default preview
