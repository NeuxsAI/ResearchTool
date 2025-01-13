declare module 'pdf-parse' {
  function parse(buffer: Buffer): Promise<{ text: string }>;
  export = parse;
} 