declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// (Optional) helpful for CSS Modules:
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}