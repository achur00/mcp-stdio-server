# TypeSpec MCP Server

A Model Context Protocol (MCP) server that provides TypeSpec compilation and API specification management capabilities.

## Features

- **TypeSpec Compilation**: Compile TypeSpec source code to OpenAPI 3.0 specifications
- **Validation**: Validate TypeSpec syntax and semantics
- **API Specification Management**: Store, retrieve, and manage API specifications
- **Template Generation**: Generate TypeSpec templates for common API patterns
- **OpenAPI Output**: Generate OpenAPI 3.0 specifications from TypeSpec models

## Available Tools

### Core Compilation Tools
- `compile-typespec` - Compile TypeSpec source to OpenAPI/JSON Schema
- `validate-typespec` - Validate TypeSpec source code
- `generate-typespec-template` - Generate TypeSpec templates

### API Specification Management
- `create-api-spec` - Create and store a new API specification
- `list-api-specs` - List all stored API specifications  
- `get-api-spec` - Retrieve a specific API specification

## Resources

- `typespec://docs/getting-started` - TypeSpec getting started guide and documentation

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run the server:
```bash
npm start
```

## Development

Start the server in development mode with auto-reload:
```bash
npm run dev
```

Compile TypeSpec files:
```bash
npm run typespec:compile
```

Watch TypeSpec files for changes:
```bash
npm run typespec:watch
```

## MCP Configuration

Add the following to your MCP client configuration:

```json
{
  "servers": {
    "typespec-mcp-server": {
      "type": "stdio", 
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## TypeSpec Examples

### Basic Service Definition
```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "My API"
})
namespace MyAPI;

@route("/users")
interface Users {
  @get list(): User[];
  @post create(@body user: CreateUserRequest): User;
}

model User {
  id: string;
  name: string;
  email: string;
  createdAt: utcDateTime;
}
```

### Advanced CRUD Service
```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Advanced API"
})
namespace AdvancedAPI;

model PaginationParams {
  @query page?: int32 = 1;
  @query limit?: int32 = 20;
}

model PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: int32;
    limit: int32;
    total: int32;
  };
}

@route("/api/v1/items")
interface Items {
  @get
  list(...PaginationParams): PaginatedResponse<Item>;
  
  @post
  create(@body item: CreateItemRequest): Item;
  
  @get
  get(@path id: string): Item;
  
  @put
  update(@path id: string, @body item: UpdateItemRequest): Item;
  
  @delete
  delete(@path id: string): void;
}
```

## Usage Examples

### Compile TypeSpec to OpenAPI
Use the `compile-typespec` tool with your TypeSpec source:

```json
{
  "source": "...",
  "outputFormat": "openapi3",
  "includeSchemas": true
}
```

### Create and Store API Specification
Use the `create-api-spec` tool:

```json
{
  "name": "My API",
  "version": "1.0.0", 
  "description": "A sample API",
  "typespecSource": "..."
}
```

### Generate Template
Use the `generate-typespec-template` tool:

```json
{
  "templateType": "rest-api",
  "serviceName": "My Service",
  "version": "1.0.0"
}
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main MCP server
│   ├── compiler.ts       # TypeSpec compiler wrapper
│   └── storage.ts        # API specification storage
├── dist/                 # Compiled JavaScript output
├── data/                 # Stored API specifications
├── main.tsp             # Example TypeSpec file
├── tspconfig.yaml       # TypeSpec configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project configuration
```

## Dependencies

- **@modelcontextprotocol/sdk** - MCP server implementation
- **@typespec/compiler** - TypeSpec compiler core
- **@typespec/openapi3** - OpenAPI 3.0 emitter
- **@typespec/http** - HTTP protocol support
- **@typespec/rest** - REST API conventions
- **zod** - Schema validation
- **express** - Web framework (for future HTTP transport)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- [TypeSpec Documentation](https://typespec.io/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub Issues](https://github.com/your-repo/issues)