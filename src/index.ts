#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';
import { createTypeSpecCompiler } from './compiler.js';
import { ApiSpecStorage } from './storage.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * TypeSpec MCP Server
 * 
 * This server provides Model Context Protocol tools for working with TypeSpec:
 * - Compile TypeSpec to OpenAPI specifications
 * - Validate TypeSpec source code
 * - Manage API specifications
 * - Generate JSON schemas from TypeSpec
 */

// Initialize storage
const storage = new ApiSpecStorage();

// Create the MCP server
const server = new McpServer({
  name: 'typespec-mcp-server',
  version: '1.0.0',
  description: 'A TypeSpec-powered Model Context Protocol server for API specification and validation'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

/**
 * Tool: Compile TypeSpec to OpenAPI
 */
server.registerTool(
  'compile-typespec',
  {
    description: 'Compile TypeSpec source code to OpenAPI 3.0 specification',
    inputSchema: {
      source: z.string().describe('TypeSpec source code to compile'),
      outputFormat: z.enum(['openapi3', 'json-schema']).default('openapi3').describe('Output format'),
      includeSchemas: z.boolean().default(false).describe('Include JSON schemas in the output')
    }
  },
  async ({ source, outputFormat, includeSchemas }): Promise<CallToolResult> => {
    try {
      const compiler = createTypeSpecCompiler();
      const result = await compiler.compile(source, {
        outputFormat,
        includeSchemas
      });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Compilation failed:\n${result.errors?.join('\n') || 'Unknown error'}`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Compilation successful!\n\nResult:\n${JSON.stringify(result.output, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error during compilation: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: Validate TypeSpec source
 */
server.registerTool(
  'validate-typespec',
  {
    description: 'Validate TypeSpec source code for syntax and semantic errors',
    inputSchema: {
      source: z.string().describe('TypeSpec source code to validate')
    }
  },
  async ({ source }): Promise<CallToolResult> => {
    try {
      const compiler = createTypeSpecCompiler();
      const result = await compiler.validate(source);

      const status = result.success ? 'Valid' : 'Invalid';
      let message = `TypeSpec validation: ${status}`;

      if (result.errors && result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors.join('\n')}`;
      }

      if (result.warnings && result.warnings.length > 0) {
        message += `\n\nWarnings:\n${result.warnings.join('\n')}`;
      }

      return {
        content: [{
          type: 'text',
          text: message
        }],
        isError: !result.success
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error during validation: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: Create API specification
 */
server.registerTool(
  'create-api-spec',
  {
    description: 'Create and store a new API specification',
    inputSchema: {
      name: z.string().describe('Name of the API specification'),
      version: z.string().describe('Version of the API'),
      description: z.string().optional().describe('Description of the API'),
      typespecSource: z.string().describe('TypeSpec source code')
    }
  },
  async ({ name, version, description, typespecSource }): Promise<CallToolResult> => {
    try {
      const spec = await storage.createSpec({
        name,
        version,
        description,
        typespecSource
      });

      return {
        content: [{
          type: 'text',
          text: `API specification created successfully!\n\nID: ${spec.id}\nName: ${spec.name}\nVersion: ${spec.version}\nCreated: ${spec.createdAt}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating API specification: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: List API specifications
 */
server.registerTool(
  'list-api-specs',
  {
    description: 'List all stored API specifications',
    inputSchema: {}
  },
  async (): Promise<CallToolResult> => {
    try {
      const specs = await storage.listSpecs();

      if (specs.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No API specifications found.'
          }]
        };
      }

      const specsList = specs.map(spec => 
        `- ${spec.name} (${spec.version}) - ID: ${spec.id}\n  Created: ${spec.createdAt}${spec.description ? `\n  Description: ${spec.description}` : ''}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${specs.length} API specification(s):\n\n${specsList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing API specifications: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: Get API specification
 */
server.registerTool(
  'get-api-spec',
  {
    description: 'Get a specific API specification by ID',
    inputSchema: {
      id: z.string().describe('ID of the API specification to retrieve')
    }
  },
  async ({ id }): Promise<CallToolResult> => {
    try {
      const spec = await storage.getSpec(id);

      if (!spec) {
        return {
          content: [{
            type: 'text',
            text: `API specification with ID "${id}" not found.`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `API Specification Details:\n\nID: ${spec.id}\nName: ${spec.name}\nVersion: ${spec.version}\nDescription: ${spec.description || 'None'}\nCreated: ${spec.createdAt}\nUpdated: ${spec.updatedAt}\n\nTypeSpec Source:\n\`\`\`typespec\n${spec.typespecSource}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error retrieving API specification: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: Compile stored API specification
 */
server.registerTool(
  'compile-stored-spec',
  {
    description: 'Compile a stored API specification to OpenAPI',
    inputSchema: {
      id: z.string().describe('ID of the API specification to compile'),
      outputFormat: z.enum(['openapi3', 'json-schema']).default('openapi3').describe('Output format')
    }
  },
  async ({ id, outputFormat }): Promise<CallToolResult> => {
    try {
      const spec = await storage.getSpec(id);
      if (!spec) {
        return {
          content: [{
            type: 'text',
            text: `API specification with ID "${id}" not found.`
          }],
          isError: true
        };
      }

      const compiler = createTypeSpecCompiler();
      const result = await compiler.compile(spec.typespecSource, { outputFormat });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Compilation failed for "${spec.name}":\n${result.errors?.join('\n') || 'Unknown error'}`
          }],
          isError: true
        };
      }

      // Update the spec with compiled output
      await storage.updateSpec(id, {
        openApiSpec: result.output
      });

      return {
        content: [{
          type: 'text',
          text: `Compilation successful for "${spec.name}"!\n\nResult:\n${JSON.stringify(result.output, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error compiling API specification: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool: Generate TypeSpec template
 */
server.registerTool(
  'generate-typespec-template',
  {
    description: 'Generate a TypeSpec template for common API patterns',
    inputSchema: {
      templateType: z.enum(['rest-api', 'crud-service', 'minimal']).describe('Type of template to generate'),
      serviceName: z.string().describe('Name of the service'),
      version: z.string().default('1.0.0').describe('Version of the API')
    }
  },
  async ({ templateType, serviceName, version }): Promise<CallToolResult> => {
    const templates = {
      'minimal': `import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "${serviceName}",
  version: "${version}"
})
namespace ${serviceName.replace(/[^a-zA-Z0-9]/g, '')};

@route("/hello")
interface HelloWorld {
  @get
  hello(): { message: string };
}`,

      'rest-api': `import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "${serviceName}",
  version: "${version}",
  description: "RESTful API service built with TypeSpec"
})
namespace ${serviceName.replace(/[^a-zA-Z0-9]/g, '')};

@doc("Standard error response")
@error
model ErrorResponse {
  @doc("Error code")
  code: string;
  
  @doc("Error message") 
  message: string;
  
  @doc("Additional details")
  details?: {};
}

@doc("Resource item")
model Item {
  @doc("Unique identifier")
  id: string;
  
  @doc("Item name")
  name: string;
  
  @doc("Item description")
  description?: string;
  
  @doc("Creation timestamp")
  createdAt: utcDateTime;
  
  @doc("Last update timestamp")
  updatedAt: utcDateTime;
}

@doc("Request to create an item")
model CreateItemRequest {
  @doc("Item name")
  name: string;
  
  @doc("Item description")
  description?: string;
}

@route("/items")
interface Items {
  @get
  @doc("List all items")
  list(): Item[] | ErrorResponse;
  
  @post
  @doc("Create a new item")
  create(@body item: CreateItemRequest): Item | ErrorResponse;
  
  @get
  @route("/{id}")
  @doc("Get item by ID")
  get(@path id: string): Item | ErrorResponse;
  
  @put
  @route("/{id}")
  @doc("Update an item")
  update(@path id: string, @body item: CreateItemRequest): Item | ErrorResponse;
  
  @delete
  @route("/{id}")
  @doc("Delete an item")
  delete(@path id: string): void | ErrorResponse;
}`,

      'crud-service': `import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "${serviceName}",
  version: "${version}",
  description: "CRUD service with advanced features"
})
namespace ${serviceName.replace(/[^a-zA-Z0-9]/g, '')};

@doc("Pagination parameters")
model PaginationParams {
  @doc("Page number (1-based)")
  @query
  page?: int32 = 1;
  
  @doc("Number of items per page")
  @query  
  limit?: int32 = 20;
}

@doc("Paginated response")
model PaginatedResponse<T> {
  @doc("Items in current page")
  data: T[];
  
  @doc("Pagination metadata")
  pagination: {
    @doc("Current page number")
    page: int32;
    
    @doc("Items per page")
    limit: int32;
    
    @doc("Total number of items")
    total: int32;
    
    @doc("Total number of pages")
    totalPages: int32;
  };
}

@doc("Standard error response")
@error
model ErrorResponse {
  @doc("Error code")
  code: string;
  
  @doc("Error message")
  message: string;
  
  @doc("Error details")
  details?: {};
  
  @doc("Timestamp of error")
  timestamp: utcDateTime;
}

@doc("Resource entity")
model Resource {
  @doc("Unique identifier")
  id: string;
  
  @doc("Resource name")
  name: string;
  
  @doc("Resource description")
  description?: string;
  
  @doc("Resource status")
  status: "active" | "inactive" | "pending";
  
  @doc("Resource tags")
  tags?: string[];
  
  @doc("Creation timestamp")
  createdAt: utcDateTime;
  
  @doc("Last update timestamp")
  updatedAt: utcDateTime;
}

@route("/api/v1/resources")
interface ResourcesAPI {
  @get
  @doc("List resources with pagination and filtering")
  list(
    ...PaginationParams,
    @query status?: "active" | "inactive" | "pending",
    @query search?: string
  ): PaginatedResponse<Resource> | ErrorResponse;
  
  @post
  @doc("Create a new resource")
  create(@body resource: {
    name: string,
    description?: string,
    status?: "active" | "inactive" | "pending",
    tags?: string[]
  }): Resource | ErrorResponse;
  
  @get
  @route("/{id}")
  @doc("Get resource by ID")
  get(@path id: string): Resource | ErrorResponse;
  
  @put
  @route("/{id}")
  @doc("Update a resource")
  update(@path id: string, @body resource: {
    name?: string,
    description?: string,
    status?: "active" | "inactive" | "pending",
    tags?: string[]
  }): Resource | ErrorResponse;
  
  @patch
  @route("/{id}")
  @doc("Partially update a resource")
  patch(@path id: string, @body patch: {
    name?: string,
    description?: string,
    status?: "active" | "inactive" | "pending"
  }): Resource | ErrorResponse;
  
  @delete
  @route("/{id}")
  @doc("Delete a resource")
  delete(@path id: string): void | ErrorResponse;
}`
    };

    const template = templates[templateType];
    
    return {
      content: [{
        type: 'text',
        text: `Generated ${templateType} TypeSpec template:\n\n\`\`\`typespec\n${template}\n\`\`\``
      }]
    };
  }
);

// Resource for TypeSpec documentation
server.resource(
  'typespec://docs/getting-started',
  'TypeSpec Getting Started Guide',
  'text/markdown',
  async () => {
    return {
      contents: [{
        uri: 'typespec://docs/getting-started',
        mimeType: 'text/markdown',
        text: `# TypeSpec Getting Started

TypeSpec is a language for defining cloud service APIs and generating other API description languages, client/server SDKs, documentation, and other assets.

## Basic Syntax

### Service Definition
\`\`\`typespec
@service({
  title: "My API",
  version: "1.0.0"
})
namespace MyAPI;
\`\`\`

### Models
\`\`\`typespec
model User {
  id: string;
  name: string;
  email: string;
  createdAt: utcDateTime;
}
\`\`\`

### Operations
\`\`\`typespec
@route("/users")
interface Users {
  @get list(): User[];
  @post create(@body user: CreateUserRequest): User;
}
\`\`\`

## Available Tools

This MCP server provides the following tools:
- \`compile-typespec\`: Compile TypeSpec to OpenAPI
- \`validate-typespec\`: Validate TypeSpec syntax
- \`create-api-spec\`: Store API specifications
- \`list-api-specs\`: List stored specifications
- \`get-api-spec\`: Retrieve specific specification
- \`compile-stored-spec\`: Compile stored specifications
- \`generate-typespec-template\`: Generate templates

## Learn More

- [TypeSpec Documentation](https://typespec.io/)
- [TypeSpec Playground](https://typespec.io/playground/)
- [OpenAPI 3 Emitter](https://typespec.io/docs/emitters/openapi3/)
`
      }]
    };
  }
);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TypeSpec MCP Server running on stdio');
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start TypeSpec MCP Server:', error);
  process.exit(1);
});