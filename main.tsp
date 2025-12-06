import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "TypeSpec MCP API",
  version: "1.0.0",
  description: "A TypeSpec-powered Model Context Protocol server for API specification and validation"
})
namespace TypeSpecMcpApi;

/**
 * API specification model for TypeSpec compilation
 */
@doc("Represents an API specification document")
model ApiSpec {
  @doc("Unique identifier for the API specification")
  id: string;

  @doc("Name of the API")
  name: string;

  @doc("Version of the API")
  version: string;

  @doc("Description of the API")
  description?: string;

  @doc("The TypeSpec source code")
  typespecSource: string;

  @doc("Generated OpenAPI 3.0 specification")
  openApiSpec?: {};

  @doc("Timestamp when the specification was created")
  createdAt: utcDateTime;

  @doc("Timestamp when the specification was last updated")
  updatedAt: utcDateTime;
}

/**
 * Request model for creating a new API specification
 */
@doc("Request to create a new API specification")
model CreateApiSpecRequest {
  @doc("Name of the API")
  name: string;

  @doc("Version of the API")
  version: string;

  @doc("Description of the API")
  description?: string;

  @doc("The TypeSpec source code to compile")
  typespecSource: string;
}

/**
 * Request model for updating an existing API specification
 */
@doc("Request to update an existing API specification")
model UpdateApiSpecRequest {
  @doc("Name of the API")
  name?: string;

  @doc("Version of the API")
  version?: string;

  @doc("Description of the API")
  description?: string;

  @doc("The TypeSpec source code to compile")
  typespecSource?: string;
}

/**
 * Response model for compilation results
 */
@doc("Result of TypeSpec compilation")
model CompilationResult {
  @doc("Whether the compilation was successful")
  success: boolean;

  @doc("Generated OpenAPI 3.0 specification (if successful)")
  openApiSpec?: {};

  @doc("JSON Schema (if requested)")
  jsonSchema?: {};

  @doc("Compilation errors (if any)")
  errors?: string[];

  @doc("Compilation warnings (if any)")
  warnings?: string[];
}

/**
 * Error response model
 */
@doc("Standard error response")
@error
model ErrorResponse {
  @doc("Error code")
  code: string;

  @doc("Error message")
  message: string;

  @doc("Additional error details")
  details?: {};
}

/**
 * API Routes
 */
@route("/api/specs")
interface ApiSpecifications {
  /**
   * Get all API specifications
   */
  @get
  @doc("List all API specifications")
  listSpecs(): ApiSpec[] | ErrorResponse;

  /**
   * Create a new API specification
   */
  @post
  @doc("Create a new API specification")
  createSpec(@body request: CreateApiSpecRequest): ApiSpec | ErrorResponse;

  /**
   * Get a specific API specification
   */
  @get
  @route("/{specId}")
  @doc("Get an API specification by ID")
  getSpec(@path specId: string): ApiSpec | ErrorResponse;

  /**
   * Update an API specification
   */
  @put
  @route("/{specId}")
  @doc("Update an API specification")
  updateSpec(@path specId: string, @body request: UpdateApiSpecRequest): ApiSpec | ErrorResponse;

  /**
   * Delete an API specification
   */
  @delete
  @route("/{specId}")
  @doc("Delete an API specification")
  deleteSpec(@path specId: string): void | ErrorResponse;

  /**
   * Compile TypeSpec source to OpenAPI
   */
  @post
  @route("/{specId}/compile")
  @doc("Compile TypeSpec source to OpenAPI specification")
  compileSpec(@path specId: string): CompilationResult | ErrorResponse;

  /**
   * Validate TypeSpec source
   */
  @post
  @route("/{specId}/validate")
  @doc("Validate TypeSpec source code")
  validateSpec(@path specId: string): CompilationResult | ErrorResponse;
}

/**
 * Compilation utilities
 */
@route("/api/utils")
interface CompilationUtils {
  /**
   * Compile TypeSpec source directly (without storing)
   */
  @post
  @route("/compile")
  @doc("Compile TypeSpec source code directly")
  compile(@body request: { 
    @doc("TypeSpec source code")
    typespecSource: string, 
    @doc("Output format (openapi3, json-schema)")
    format?: "openapi3" | "json-schema" 
  }): CompilationResult | ErrorResponse;

  /**
   * Get TypeSpec language information
   */
  @get
  @route("/info")
  @doc("Get TypeSpec compiler and language information")
  getInfo(): {
    @doc("TypeSpec compiler version")
    compilerVersion: string,
    @doc("Available emitters")
    emitters: string[],
    @doc("Supported formats")
    formats: string[]
  } | ErrorResponse;
}