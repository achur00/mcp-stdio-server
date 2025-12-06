<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TypeSpec MCP Server Project

This project is a Model Context Protocol (MCP) server built with TypeScript and TypeSpec.

## Project Setup Progress

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project  
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## Project Overview

This TypeSpec MCP Server provides:

### Tools Available
- `compile-typespec` - Compile TypeSpec source to OpenAPI/JSON Schema
- `validate-typespec` - Validate TypeSpec syntax and semantics
- `create-api-spec` - Create and store API specifications
- `list-api-specs` - List all stored specifications
- `get-api-spec` - Retrieve specific specifications  
- `compile-stored-spec` - Compile stored specifications
- `generate-typespec-template` - Generate TypeSpec templates

### Resources
- `typespec://docs/getting-started` - TypeSpec documentation and guides

### Build Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm start` - Start the MCP server
- `npm run typespec:compile` - Compile TypeSpec files

### MCP Configuration
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

## References
- MCP SDK Documentation: https://github.com/modelcontextprotocol
- TypeSpec Documentation: https://typespec.io/
- Implementation Guide: https://modelcontextprotocol.io/llms-full.txt

## Project Structure
```
├── src/
│   ├── index.ts          # Main MCP server
│   ├── compiler.ts       # TypeSpec compiler wrapper  
│   └── storage.ts        # API specification storage
├── dist/                 # Compiled JavaScript output
├── .vscode/
│   └── mcp.json         # MCP server configuration
├── main.tsp             # Example TypeSpec file
├── tspconfig.yaml       # TypeSpec configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project configuration
└── README.md            # Project documentation
```

The project is now ready for development and can be used to compile TypeSpec specifications to OpenAPI via the Model Context Protocol.