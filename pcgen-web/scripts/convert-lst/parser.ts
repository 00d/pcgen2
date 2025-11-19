/**
 * Core LST file parser
 * Parses PCGen LST files into structured tokens
 */

import * as fs from 'fs';
import type { LSTFile, LSTLine, LSTToken, ParserOptions } from './types';

export class LSTParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      verbose: false,
      strictMode: false,
      skipComments: true,
      skipBlankLines: true,
      ...options,
    };
  }

  /**
   * Parse an LST file from a file path
   */
  parseLSTFile(filePath: string): LSTFile {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const lstFile: LSTFile = {
      source: {
        long: '',
        short: '',
      },
      lines: [],
      metadata: {
        filePath,
        parsed: new Date(),
      },
    };

    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Skip empty lines
      if (this.options.skipBlankLines && line.trim() === '') {
        continue;
      }

      // Parse source metadata from comment lines first
      if (line.includes('SOURCELONG:') || line.includes('SOURCESHORT:') || line.includes('SOURCEWEB:') || line.includes('SOURCEDATE:')) {
        this.parseSourceMetadata(line, lstFile);
      }

      // Skip comments after extracting metadata
      if (this.options.skipComments && line.trim().startsWith('#')) {
        continue;
      }

      // Parse regular data line
      const lstLine = this.parseLine(line, lineNumber);
      if (lstLine.tokens.length > 0) {
        lstFile.lines.push(lstLine);
      }
    }

    return lstFile;
  }

  /**
   * Parse source metadata from comment lines
   */
  private parseSourceMetadata(line: string, lstFile: LSTFile): void {
    const tokens = line.split('\t');
    for (const token of tokens) {
      if (token.includes('SOURCELONG:')) {
        lstFile.source.long = token.split('SOURCELONG:')[1]?.trim() || '';
      }
      if (token.includes('SOURCESHORT:')) {
        lstFile.source.short = token.split('SOURCESHORT:')[1]?.trim() || '';
      }
      if (token.includes('SOURCEWEB:')) {
        lstFile.source.web = token.split('SOURCEWEB:')[1]?.trim() || '';
      }
      if (token.includes('SOURCEDATE:')) {
        lstFile.source.date = token.split('SOURCEDATE:')[1]?.trim() || '';
      }
    }
  }

  /**
   * Parse a single line into tokens
   */
  private parseLine(line: string, lineNumber: number): LSTLine {
    const lstLine: LSTLine = {
      tokens: [],
      raw: line,
      lineNumber,
    };

    // Split by tabs
    const parts = line.split('\t');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;

      // Parse token
      const token = this.parseToken(trimmed);
      if (token) {
        lstLine.tokens.push(token);
      }
    }

    return lstLine;
  }

  /**
   * Parse a single token (KEY:VALUE format)
   */
  private parseToken(tokenStr: string): LSTToken | null {
    // Check if it contains a colon (token format)
    const colonIndex = tokenStr.indexOf(':');

    if (colonIndex === -1) {
      // No colon, treat entire string as key with empty value
      return {
        key: tokenStr,
        value: '',
        raw: tokenStr,
      };
    }

    const key = tokenStr.substring(0, colonIndex);
    const valueStr = tokenStr.substring(colonIndex + 1);

    // Parse value - could be simple string or complex (pipe-separated, etc.)
    const value = this.parseValue(valueStr);

    return {
      key,
      value,
      raw: tokenStr,
    };
  }

  /**
   * Parse token value - handles pipes, arrays, etc.
   */
  private parseValue(valueStr: string): string | string[] {
    // Check if value contains pipes (array indicator)
    if (valueStr.includes('|')) {
      return valueStr.split('|').map(v => v.trim());
    }

    return valueStr;
  }

  /**
   * Get all tokens with a specific key from an LST file
   */
  getTokensByKey(lstFile: LSTFile, key: string): LSTToken[] {
    const tokens: LSTToken[] = [];

    for (const line of lstFile.lines) {
      for (const token of line.tokens) {
        if (token.key === key) {
          tokens.push(token);
        }
      }
    }

    return tokens;
  }

  /**
   * Get the first token value for a given key
   */
  getTokenValue(lstFile: LSTFile, key: string): string | string[] | null {
    const tokens = this.getTokensByKey(lstFile, key);
    return tokens.length > 0 ? tokens[0].value : null;
  }

  /**
   * Group lines by object (lines starting with same identifier)
   * For example, all CLASS:Barbarian lines are grouped together
   */
  groupByObject(lstFile: LSTFile, objectKey: string): Map<string, LSTLine[]> {
    const groups = new Map<string, LSTLine[]>();

    let currentObjectName: string | null = null;

    for (const line of lstFile.lines) {
      // Check if this line starts with the object key
      const firstToken = line.tokens[0];
      if (!firstToken) continue;

      if (firstToken.key === objectKey) {
        // New object
        currentObjectName = Array.isArray(firstToken.value)
          ? firstToken.value[0]
          : firstToken.value;

        if (!groups.has(currentObjectName)) {
          groups.set(currentObjectName, []);
        }
      }

      // Add line to current object group
      if (currentObjectName) {
        const group = groups.get(currentObjectName);
        if (group) {
          group.push(line);
        }
      }
    }

    return groups;
  }

  /**
   * Extract all tokens from a group of lines
   */
  extractTokensFromLines(lines: LSTLine[]): Map<string, LSTToken[]> {
    const tokenMap = new Map<string, LSTToken[]>();

    for (const line of lines) {
      for (const token of line.tokens) {
        if (!tokenMap.has(token.key)) {
          tokenMap.set(token.key, []);
        }
        tokenMap.get(token.key)!.push(token);
      }
    }

    return tokenMap;
  }
}

// Utility functions

/**
 * Convert token value to string (handle arrays)
 */
export function tokenValueToString(value: string | string[]): string {
  return Array.isArray(value) ? value.join('|') : value;
}

/**
 * Convert token value to array (handle strings)
 */
export function tokenValueToArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Extract numeric value from string (e.g., "HD:12" -> 12)
 */
export function extractNumber(value: string | string[]): number | null {
  const str = tokenValueToString(value);
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Parse BONUS token value
 * Format: BONUS:TYPE|target|value|conditions
 */
export function parseBonus(value: string | string[]): {
  type: string;
  target: string;
  value: string;
  conditions?: string[];
} | null {
  const parts = tokenValueToArray(value);
  if (parts.length < 3) return null;

  return {
    type: parts[0],
    target: parts[1],
    value: parts[2],
    conditions: parts.slice(3),
  };
}
