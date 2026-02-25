import '../src/index.css'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    toolbar: {
      items: ['light','dark'],
    },
  },
}
