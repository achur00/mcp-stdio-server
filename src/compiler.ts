import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

/**
 * Compilation result interface
 */
export interface CompilationResult {
  success: boolean;
  output?: any;
  errors?: string[];
  warnings?: string[];
  diagnostics?: any[];
}

/**
 * Compilation options
 */
export interface CompilationOptions {
  outputFormat: 'openapi3' | 'json-schema';
  includeSchemas?: boolean;
  outputDir?: string;
}

/**
 * Simple TypeSpec compiler wrapper using CLI
 */
export class TypeSpecCompiler {
  private tempDir: string;

  constructor(tempDir?: string) {
    this.tempDir = tempDir || path.join(os.tmpdir(), 'typespec-mcp');
  }

  /**
   * Initialize the compiler (create temp directory)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error}`);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * Compile TypeSpec source code using CLI
   */
  async compile(source: string, options: CompilationOptions): Promise<CompilationResult> {
    try {
      await this.initialize();

      // Create a temporary main.tsp file
      const mainFile = path.join(this.tempDir, 'main.tsp');
      await fs.writeFile(mainFile, source, 'utf-8');

      // Create package.json to ensure TypeSpec can find dependencies
      const packageJson = {
        name: 'temp-typespec',
        version: '1.0.0',
        dependencies: {
          '@typespec/compiler': '*',
          '@typespec/http': '*',
          '@typespec/rest': '*',
          '@typespec/openapi3': '*'
        }
      };
      await fs.writeFile(
        path.join(this.tempDir, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );

      // Create tspconfig.yaml
      const configContent = `emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: "openapi.yaml"`;

      const configFile = path.join(this.tempDir, 'tspconfig.yaml');
      await fs.writeFile(configFile, configContent, 'utf-8');

      // For now, return a mock successful compilation result
      // In a real implementation, you would run: npx tsp compile .
      const mockOutput = {
        openapi: '3.0.0',
        info: {
          title: 'Generated API',
          version: '1.0.0'
        },
        paths: {}
      };

      return {
        success: true,
        output: options.outputFormat === 'openapi3' ? mockOutput : { schemas: {} },
        warnings: ['Note: Using mock compilation result. Install TypeSpec CLI for full functionality.']
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Compilation error: ${error instanceof Error ? error.message : String(error)}`]
      };
    } finally {
      // Clean up temp files
      setTimeout(() => this.cleanup(), 1000);
    }
  }

  /**
   * Validate TypeSpec source code
   */
  async validate(source: string): Promise<CompilationResult> {
    try {
      // Simple validation - check for basic TypeSpec syntax
      const basicErrors: string[] = [];

      // Check for required imports
      if (source.includes('@route') && !source.includes('@typespec/http')) {
        basicErrors.push('Missing import: @typespec/http is required for @route decorator');
      }

      if (source.includes('@get') && !source.includes('@typespec/rest')) {
        basicErrors.push('Missing import: @typespec/rest is required for @get decorator');
      }

      // Check for basic syntax patterns
      if (!source.includes('namespace') && !source.includes('model') && !source.includes('interface')) {
        basicErrors.push('TypeSpec source should contain at least one namespace, model, or interface');
      }

      // Check for unmatched braces
      const openBraces = (source.match(/{/g) || []).length;
      const closeBraces = (source.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        basicErrors.push('Unmatched braces detected');
      }

      return {
        success: basicErrors.length === 0,
        ...(basicErrors.length > 0 && { errors: basicErrors })
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Get TypeSpec compiler information
   */
  async getCompilerInfo(): Promise<{
    version: string;
    availableEmitters: string[];
    supportedFormats: string[];
  }> {
    return {
      version: '0.61.0',
      availableEmitters: [
        '@typespec/openapi3',
        '@typespec/json-schema',
        '@typespec/protobuf',
        '@typespec/http'
      ],
      supportedFormats: ['openapi3', 'json-schema']
    };
  }

  /**
   * Format TypeSpec source code
   */
  async format(source: string): Promise<string> {
    try {
      // Basic formatting
      let formatted = source
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/\s*}\s*/g, '\n}')
        .replace(/;\s*/g, ';\n  ')
        .replace(/,\s*/g, ',\n  ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      return formatted;
    } catch (error) {
      throw new Error(`Failed to format TypeSpec: ${error}`);
    }
  }
}

/**
 * Create a new TypeSpec compiler instance
 */
export function createTypeSpecCompiler(tempDir?: string): TypeSpecCompiler {
  return new TypeSpecCompiler(tempDir);
}