// TypeScript scaffold to enable type-check to pass when no .ts files exist yet.
// Minimal module declaration to allow importing jQuery without @types/jquery.
declare module 'jquery' {
  const jQuery: any
  export default jQuery
}
