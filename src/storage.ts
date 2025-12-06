import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * API Specification data model
 */
export interface ApiSpec {
  id: string;
  name: string;
  version: string;
  description?: string;
  typespecSource: string;
  openApiSpec?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request models for API operations
 */
export interface CreateApiSpecRequest {
  name: string;
  version: string;
  description?: string;
  typespecSource: string;
}

export interface UpdateApiSpecRequest {
  name?: string;
  version?: string;
  description?: string;
  typespecSource?: string;
  openApiSpec?: any;
}

/**
 * Simple in-memory storage for API specifications
 * In a production environment, this would be replaced with a proper database
 */
export class ApiSpecStorage {
  private specs: Map<string, ApiSpec> = new Map();
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  /**
   * Initialize storage (create data directory if needed)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadFromDisk();
    } catch (error) {
      console.warn('Could not initialize storage directory:', error);
      // Continue with in-memory storage only
    }
  }

  /**
   * Load specifications from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const files = await fs.readdir(this.dataDir);
      const specFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of specFiles) {
        try {
          const filePath = path.join(this.dataDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const spec: ApiSpec = JSON.parse(content);
          this.specs.set(spec.id, spec);
        } catch (error) {
          console.warn(`Could not load spec file ${file}:`, error);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, continue with empty storage
    }
  }

  /**
   * Save a specification to disk
   */
  private async saveToDisk(spec: ApiSpec): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `${spec.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(spec, null, 2));
    } catch (error) {
      console.warn(`Could not save spec ${spec.id} to disk:`, error);
    }
  }

  /**
   * Delete a specification from disk
   */
  private async deleteFromDisk(id: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `${id}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Could not delete spec ${id} from disk:`, error);
    }
  }

  /**
   * Create a new API specification
   */
  async createSpec(request: CreateApiSpecRequest): Promise<ApiSpec> {
    const now = new Date().toISOString();
    const spec: ApiSpec = {
      id: randomUUID(),
      name: request.name,
      version: request.version,
      typespecSource: request.typespecSource,
      createdAt: now,
      updatedAt: now
    };
    
    if (request.description !== undefined) {
      spec.description = request.description;
    }

    this.specs.set(spec.id, spec);
    await this.saveToDisk(spec);
    return spec;
  }

  /**
   * Get all API specifications
   */
  async listSpecs(): Promise<ApiSpec[]> {
    return Array.from(this.specs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get a specific API specification by ID
   */
  async getSpec(id: string): Promise<ApiSpec | null> {
    return this.specs.get(id) || null;
  }

  /**
   * Update an existing API specification
   */
  async updateSpec(id: string, request: UpdateApiSpecRequest): Promise<ApiSpec | null> {
    const existingSpec = this.specs.get(id);
    if (!existingSpec) {
      return null;
    }

    const updatedSpec: ApiSpec = {
      ...existingSpec,
      ...request,
      updatedAt: new Date().toISOString()
    };

    this.specs.set(id, updatedSpec);
    await this.saveToDisk(updatedSpec);
    return updatedSpec;
  }

  /**
   * Delete an API specification
   */
  async deleteSpec(id: string): Promise<boolean> {
    const deleted = this.specs.delete(id);
    if (deleted) {
      await this.deleteFromDisk(id);
    }
    return deleted;
  }

  /**
   * Search specifications by name or description
   */
  async searchSpecs(query: string): Promise<ApiSpec[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.specs.values()).filter(spec =>
      spec.name.toLowerCase().includes(lowerQuery) ||
      (spec.description && spec.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get specifications by name
   */
  async getSpecsByName(name: string): Promise<ApiSpec[]> {
    return Array.from(this.specs.values()).filter(spec => 
      spec.name === name
    );
  }

  /**
   * Get the latest version of a specification by name
   */
  async getLatestSpecByName(name: string): Promise<ApiSpec | null> {
    const specs = await this.getSpecsByName(name);
    if (specs.length === 0) {
      return null;
    }

    // Sort by version (simple string comparison, could be enhanced with semver)
    specs.sort((a, b) => b.version.localeCompare(a.version));
    return specs[0] || null;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalSpecs: number;
    totalSize: number;
    oldestSpec?: string;
    newestSpec?: string;
  }> {
    const specs = Array.from(this.specs.values());
    const totalSpecs = specs.length;
    const totalSize = JSON.stringify(specs).length;

    if (specs.length === 0) {
      return { totalSpecs: 0, totalSize: 0 };
    }

    const sorted = specs.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const result: { totalSpecs: number; totalSize: number; oldestSpec?: string; newestSpec?: string } = {
      totalSpecs,
      totalSize
    };

    if (sorted[0]) {
      result.oldestSpec = sorted[0].createdAt;
    }
    if (sorted[sorted.length - 1]) {
      result.newestSpec = sorted[sorted.length - 1].createdAt;
    }

    return result;
  }
}