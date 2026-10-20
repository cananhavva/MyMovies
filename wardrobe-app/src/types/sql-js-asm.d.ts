/** sql.js pure-JS (asm.js) build: no wasm, so it runs under CSPs that block WebAssembly. */
declare module 'sql.js/dist/sql-asm.js' {
  import initSqlJs from 'sql.js';
  export default initSqlJs;
}
