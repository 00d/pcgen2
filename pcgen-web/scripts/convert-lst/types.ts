/**
 * Type definitions for LST parsing
 */

export interface LSTToken {
  key: string;
  value: string | string[];
  raw: string;
}

export interface LSTLine {
  tokens: LSTToken[];
  raw: string;
  lineNumber: number;
}

export interface LSTFile {
  source: {
    long: string;
    short: string;
    web?: string;
    date?: string;
  };
  lines: LSTLine[];
  metadata: {
    filePath: string;
    parsed: Date;
  };
}

export interface ParsedObject {
  id: string;
  name: string;
  source: {
    name: string;
    shortName: string;
    page?: string;
    url?: string;
  };
  [key: string]: any;
}

export interface ParserOptions {
  verbose?: boolean;
  strictMode?: boolean;
  skipComments?: boolean;
  skipBlankLines?: boolean;
}
