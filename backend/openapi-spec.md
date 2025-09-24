# OpenAPI Specification for Booky Backend API

This document contains the OpenAPI 3.0.3 specification for the Booky backend API, which provides endpoints for authentication, user management, collections, bookmarks, highlights, and search functionality.

```yaml
openapi: 3.0.3
info:
  title: Booky Backend API
  version: 1.0.0
  description: API for managing bookmarks, collections, and user data in the Booky application.

servers:
  - url: https://api.booky.com/v1
    description: Production server

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /auth/login or /auth/register

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: Unique user identifier
        email:
          type: string
          format: email
          description: User's email address
        name:
          type: string
          description: User's display name
        created_at:
          type: string
          format: date-time
          description: Account creation timestamp
        plan:
          type: string
          enum: [free, premium]
          description: User's subscription plan

    Collection:
      type: object
      properties:
        id:
          type: integer
          description: Unique collection identifier
        owner_id:
          type: integer
          description: ID of the collection owner
        title:
          type: string
          description: Collection title
        icon:
          type: string
          description: Collection icon URL or identifier
        is_public:
          type: boolean
          description: Whether the collection is publicly accessible
        share_slug:
          type: string
          description: Unique slug for sharing the collection
        created_at:
          type: string
          format: date-time
          description: Collection creation timestamp
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp

    Bookmark:
      type: object
      properties:
        id:
          type: integer
          description: Unique bookmark identifier
        owner_id:
          type: integer
          description: ID of the bookmark owner
        collection_id:
          type: integer
          description: ID of the containing collection
        title:
          type: string
          description: Bookmark title
        url:
          type: string
          format: uri
          description: Bookmarked URL
        excerpt:
          type: string
          description: Excerpt or description
        content_snapshot_path:
          type: string
          description: Path to content snapshot
        content_indexed:
          type: boolean
          description: Whether content has been indexed
        type:
          type: string
          description: Bookmark type (e.g., article, video)
        domain:
          type: string
          description: Domain of the URL
        cover_url:
          type: string
          format: uri
          description: Cover image URL
        is_duplicate:
          type: boolean
          description: Whether this is a duplicate bookmark
        is_broken:
          type: boolean
          description: Whether the URL is broken
        created_at:
          type: string
          format: date-time
          description: Bookmark creation timestamp
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp
        tags:
          type: array
          items:
            $ref: "#/components/schemas/Tag"
          description: Associated tags

    Tag:
      type: object
      properties:
        id:
          type: integer
          description: Unique tag identifier
        name:
          type: string
          description: Tag name
        normalized_name:
          type: string
          description: Normalized tag name for searching

    Highlight:
      type: object
      properties:
        id:
          type: integer
          description: Unique highlight identifier
        bookmark_id:
          type: integer
          description: ID of the associated bookmark
        text_selected:
          type: string
          description: Selected text
        color:
          type: string
          description: Highlight color
        annotation_md:
          type: string
          description: Markdown annotation
        position_context:
          type: string
          description: Context of the highlight position
        created_at:
          type: string
          format: date-time
          description: Highlight creation timestamp

    Error:
      type: object
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message

    AuthRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          description: User's email
        password:
          type: string
          minLength: 6
          description: User's password

    RegisterRequest:
      allOf:
        - $ref: "#/components/schemas/AuthRequest"
        - type: object
          properties:
            name:
              type: string
              description: User's display name

    AuthResponse:
      type: object
      properties:
        user:
          $ref: "#/components/schemas/User"
        token:
          type: string
          description: JWT access token

    CollectionCreateRequest:
      type: object
      required:
        - title
      properties:
        title:
          type: string
          description: Collection title
        icon:
          type: string
          description: Collection icon
        is_public:
          type: boolean
          description: Public visibility flag

    BookmarkCreateRequest:
      type: object
      required:
        - url
      properties:
        title:
          type: string
          description: Bookmark title
        url:
          type: string
          format: uri
          description: URL to bookmark
        excerpt:
          type: string
          description: Excerpt or description
        collection_id:
          type: integer
          description: Collection ID to add to

    HighlightCreateRequest:
      type: object
      required:
        - text_selected
      properties:
        text_selected:
          type: string
          description: Text to highlight
        color:
          type: string
          description: Highlight color
        annotation_md:
          type: string
          description: Markdown annotation
        position_context:
          type: string
          description: Position context

paths:
  /auth/register:
    post:
      summary: Register a new user account
      description: Creates a new user account and returns authentication token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RegisterRequest"
      responses:
        "201":
          description: User account created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"
        "400":
          description: Invalid request data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "409":
          description: Email already exists
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /auth/login:
    post:
      summary: Authenticate user
      description: Logs in a user and returns authentication token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AuthRequest"
      responses:
        "200":
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"
        "401":
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /auth/refresh:
    post:
      summary: Refresh access token
      description: Generates a new access token using refresh token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refreshToken
              properties:
                refreshToken:
                  type: string
                  description: Refresh token
      responses:
        "200":
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: New access token
        "401":
          description: Invalid refresh token
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /user:
    get:
      summary: Get current user profile
      description: Retrieves the profile of the authenticated user
      security:
        - bearerAuth: []
      responses:
        "200":
          description: User profile retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "401":
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

    put:
      summary: Update user profile
      description: Updates the authenticated user's profile information
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: New display name
                plan:
                  type: string
                  enum: [free, premium]
                  description: New subscription plan
      responses:
        "200":
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          description: Invalid request data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Unauthorized

  /collections:
    get:
      summary: List user collections
      description: Retrieves all collections owned by the authenticated user
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Collections retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Collection"
        "401":
          description: Unauthorized

    post:
      summary: Create a new collection
      description: Creates a new bookmark collection for the authenticated user
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CollectionCreateRequest"
      responses:
        "201":
          description: Collection created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Collection"
        "400":
          description: Invalid request data
        "401":
          description: Unauthorized

  /collections/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Collection ID
    get:
      summary: Get collection by ID
      description: Retrieves a specific collection by its ID
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Collection retrieved successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Collection"
        "403":
          description: Forbidden - no access to collection
        "404":
          description: Collection not found

    put:
      summary: Update collection
      description: Updates an existing collection
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CollectionCreateRequest"
      responses:
        "200":
          description: Collection updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Collection"
        "400":
          description: Invalid request data
        "403":
          description: Forbidden
        "404":
          description: Collection not found

    delete:
      summary: Delete collection
      description: Deletes a collection and all its bookmarks
      security:
        - bearerAuth: []
      responses:
        "204":
          description: Collection deleted successfully
        "403":
          description: Forbidden
        "404":
          description: Collection not found

  /collections/{id}/share:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Collection ID
    post:
      summary: Share collection with user
      description: Grants access to a collection for another user
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - user_id
                - role
              properties:
                user_id:
                  type: integer
                  description: User ID to share with
                role:
                  type: string
                  enum: [viewer, editor, owner]
                  description: Permission role
      responses:
        "201":
          description: Collection shared successfully
        "400":
          description: Invalid request data
        "403":
          description: Forbidden - not collection owner
        "404":
          description: Collection or user not found

  /collections/{collectionId}/bookmarks:
    parameters:
      - name: collectionId
        in: path
        required: true
        schema:
          type: integer
        description: Collection ID
    get:
      summary: List bookmarks in collection
      description: Retrieves all bookmarks in a specific collection
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Bookmarks retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Bookmark"
        "403":
          description: Forbidden
        "404":
          description: Collection not found

    post:
      summary: Create bookmark in collection
      description: Adds a new bookmark to the specified collection
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BookmarkCreateRequest"
      responses:
        "201":
          description: Bookmark created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Bookmark"
        "400":
          description: Invalid request data
        "403":
          description: Forbidden
        "404":
          description: Collection not found

  /bookmarks/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Bookmark ID
    get:
      summary: Get bookmark by ID
      description: Retrieves a specific bookmark by its ID
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Bookmark retrieved successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Bookmark"
        "403":
          description: Forbidden
        "404":
          description: Bookmark not found

    put:
      summary: Update bookmark
      description: Updates an existing bookmark
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BookmarkCreateRequest"
      responses:
        "200":
          description: Bookmark updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Bookmark"
        "400":
          description: Invalid request data
        "403":
          description: Forbidden
        "404":
          description: Bookmark not found

    delete:
      summary: Delete bookmark
      description: Deletes a bookmark
      security:
        - bearerAuth: []
      responses:
        "204":
          description: Bookmark deleted successfully
        "403":
          description: Forbidden
        "404":
          description: Bookmark not found

  /bookmarks/{bookmarkId}/highlights:
    parameters:
      - name: bookmarkId
        in: path
        required: true
        schema:
          type: integer
        description: Bookmark ID
    get:
      summary: List highlights for bookmark
      description: Retrieves all highlights for a specific bookmark
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Highlights retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Highlight"
        "403":
          description: Forbidden
        "404":
          description: Bookmark not found

    post:
      summary: Create highlight for bookmark
      description: Adds a new highlight to the specified bookmark
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/HighlightCreateRequest"
      responses:
        "201":
          description: Highlight created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Highlight"
        "400":
          description: Invalid request data
        "403":
          description: Forbidden
        "404":
          description: Bookmark not found

  /highlights/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Highlight ID
    put:
      summary: Update highlight
      description: Updates an existing highlight
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/HighlightCreateRequest"
      responses:
        "200":
          description: Highlight updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Highlight"
        "400":
          description: Invalid request data
        "403":
          description: Forbidden
        "404":
          description: Highlight not found

    delete:
      summary: Delete highlight
      description: Deletes a highlight
      security:
        - bearerAuth: []
      responses:
        "204":
          description: Highlight deleted successfully
        "403":
          description: Forbidden
        "404":
          description: Highlight not found

  /search:
    get:
      summary: Search bookmarks
      description: Searches bookmarks by query, tags, and collection
      security:
        - bearerAuth: []
      parameters:
        - name: q
          in: query
          schema:
            type: string
          description: Search query string
        - name: tags
          in: query
          schema:
            type: string
          description: Comma-separated list of tag names
        - name: collection_id
          in: query
          schema:
            type: integer
          description: Collection ID to search within
      responses:
        "200":
          description: Search results retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Bookmark"
        "400":
          description: Invalid query parameters
        "401":
          description: Unauthorized
```
