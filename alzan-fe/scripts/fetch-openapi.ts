#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import 'dotenv/config';
import configImport from '../openapi-ts.config.mjs';

export interface FetchConfig {
  input: string;
  output: string;
}

export interface Config {
  fetchers: FetchConfig[];
}

/**
 * Replaces environment variable placeholders in a string with their actual values
 * Example: "${API_URL}/path" becomes "https://api.example.com/path"
 */
function resolveEnvVariables(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const value = process.env[varName];
    if (value === undefined) {
      throw new Error(`Environment variable ${varName} is not defined`);
    }
    return value;
  });
}

/**
 * Fetches JSON content from a URL
 */
function fetchJson(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client
      .get(url, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Validate that it's valid JSON
            JSON.parse(data);
            resolve(data);
          } catch (error) {
            reject(new Error(`Invalid JSON received from ${url}: ${error}`));
          }
        });
      })
      .on('error', error => {
        reject(new Error(`Network error fetching ${url}: ${error.message}`));
      });
  });
}

/**
 * Ensures the directory exists for the given file path
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Main function to process the configuration and fetch all JSON files
 */
async function main() {
  const config: Config = configImport;
  // Validate config structure
  if (!config.fetchers || !Array.isArray(config.fetchers)) {
    console.error('Error: Configuration must contain a "fetchers" array');
    process.exit(1);
  }

  console.log(`Processing ${config.fetchers.length} fetch configuration(s)...\n`);

  // Process each fetch configuration
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < config.fetchers.length; i++) {
    const fetchConfig = config.fetchers[i];

    try {
      // Resolve environment variables
      const inputUrl = resolveEnvVariables(fetchConfig.input);
      const outputPath = resolveEnvVariables(fetchConfig.output);

      console.log(`[${i + 1}/${config.fetchers.length}] Fetching from: ${inputUrl}`);

      // Fetch JSON
      const jsonContent = await fetchJson(inputUrl);

      // Ensure output directory exists
      ensureDirectoryExists(outputPath);

      // Write to file
      fs.writeFileSync(outputPath, jsonContent, 'utf-8');

      console.log(`âœ“ Saved to: ${outputPath}\n`);
      successCount++;
    } catch (error) {
      console.error(`âœ— Failed: ${error}\n`);
      failureCount++;
    }
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`Summary: ${successCount} succeeded, ${failureCount} failed`);

  if (failureCount > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
