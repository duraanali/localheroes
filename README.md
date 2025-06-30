# Local Heroes API Documentation

Base URL: `https://localheroes.vercel.app`

## Authentication

This API uses JWT (JSON Web Tokens) for authentication with token blacklisting for secure logout functionality.

### Token Management

- **Token Format**: JWT tokens with 7-day expiration
- **Storage**: Tokens are stored client-side (localStorage/sessionStorage)
- **Blacklisting**: Logged out tokens are blacklisted in the database
- **Validation**: All authenticated requests validate token authenticity and blacklist status

### Authorization Header

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Validation Process

1. **Token Format Check**: Validates Bearer token format
2. **JWT Verification**: Verifies token signature and expiration
3. **Blacklist Check**: Ensures token hasn't been revoked via logout
4. **User Context**: Extracts user information for request processing

### Error Responses

- **401 Unauthorized**: Missing or invalid Authorization header
- **401 Invalid token**: JWT verification failed (expired, malformed, etc.)
- **401 Token has been revoked**: Token is in blacklist (user logged out)

## Auth Endpoints

### Register User

- **POST** `/api/auth/register`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Validation**:
  - name: minimum 2 characters
  - email: valid email format
  - password: minimum 6 characters
- **Success Response** (200):
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input or user already exists
  - 500: Internal server error

### Login

- **POST** `/api/auth/login`
- **Description**: Login with email and password
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Validation**:
  - email: valid email format
  - password: minimum 6 characters
- **Success Response** (200):
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input
  - 401: Invalid credentials
  - 500: Internal server error

### Logout

- **POST** `/api/auth/logout`
- **Description**: Securely logout user by blacklisting their JWT token
- **Authentication**: Required (valid JWT token)
- **Process**:
  1. Validates the provided JWT token
  2. Adds token to blacklist in database
  3. Returns success response
  4. Client should remove token from storage
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "userId": "string"
  }
  ```
- **Error Responses**:
  - 401: Invalid or missing token
  - 500: Internal server error

**Client-side Logout Example:**

```javascript
const logout = async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Remove token from client storage
      localStorage.removeItem("token");
      // Redirect to login page
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
};
```

**Token Blacklist Management:**

- Tokens are automatically blacklisted on logout
- Blacklisted tokens are rejected on all authenticated requests
- Expired tokens can be manually cleaned up using the cleanup function
- Blacklist includes token hash, user ID, and expiration timestamp

## Heroes Endpoints

### Get All Heroes

- **GET** `/api/heroes`
- **Description**: Get all heroes with optional filtering
- **Query Parameters**:
  - tag: Filter by tag
  - location: Filter by location
- **Success Response** (200):
  ```json
  [
    {
      "id": "string",
      "full_name": "string",
      "story": "string",
      "location": "string",
      "tags": ["string"],
      "photo_url": "string",
      "created_by": "string",
      "created_at": "number",
      "thanks_count": "number"
    }
  ]
  ```
- **Error Response**:
  - 500: Internal server error

### Create Hero

- **POST** `/api/heroes`
- **Description**: Create a new hero nomination
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "full_name": "string",
    "story": "string",
    "location": "string",
    "tags": ["string"],
    "photo_url": "string"
  }
  ```
- **Validation**:
  - full_name: minimum 2 characters
  - story: minimum 10 characters
  - location: minimum 2 characters
  - tags: at least one tag required
  - photo_url: valid URL
- **Success Response** (201):
  ```json
  {
    "id": "string",
    "full_name": "string",
    "story": "string",
    "location": "string",
    "tags": ["string"],
    "photo_url": "string",
    "created_by": "string",
    "created_at": "number"
  }
  ```
- **Error Responses**:
  - 400: Invalid input
  - 401: Unauthorized
  - 500: Internal server error

### Get Hero by ID

- **GET** `/api/heroes/:id`
- **Description**: Get a specific hero's details
- **Success Response** (200):
  ```json
  {
    "id": "string",
    "full_name": "string",
    "story": "string",
    "location": "string",
    "tags": ["string"],
    "photo_url": "string",
    "created_by": "string",
    "created_at": "number",
    "thanks_count": "number",
    "comments": [
      {
        "id": "string",
        "text": "string",
        "created_by": "string",
        "created_at": "number"
      }
    ]
  }
  ```
- **Error Responses**:
  - 404: Hero not found
  - 500: Internal server error

### Delete Hero

- **DELETE** `/api/heroes/:id`
- **Description**: Delete a hero nomination
- **Authentication**: Required (only creator can delete)
- **Success Response** (200):
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - 401: Unauthorized
  - 403: Only creator can delete
  - 404: Hero not found
  - 500: Internal server error

### Thank Hero

- **POST** `/api/heroes/:id/thank`
- **Description**: Thank a hero
- **Authentication**: Required
- **Success Response** (200):
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - 400: Already thanked
  - 401: Unauthorized
  - 500: Internal server error

### Get Hero Comments

- **GET** `/api/heroes/:id/comments`
- **Description**: Get all comments for a hero
- **Success Response** (200):
  ```json
  [
    {
      "id": "string",
      "text": "string",
      "created_by": "string",
      "created_at": "number"
    }
  ]
  ```
- **Error Response**:
  - 500: Internal server error

### Add Comment

- **POST** `/api/heroes/:id/comments`
- **Description**: Add a comment to a hero
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "text": "string"
  }
  ```
- **Validation**:
  - text: required
- **Success Response** (201):
  ```json
  {
    "id": "string",
    "text": "string",
    "created_by": "string",
    "created_at": "number"
  }
  ```
- **Error Responses**:
  - 400: Invalid input
  - 401: Unauthorized
  - 500: Internal server error

## User Endpoints

### Get Current User

- **GET** `/api/users/me`
- **Description**: Get current user's profile and heroes
- **Authentication**: Required
- **Success Response** (200):
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "heroes": [
      {
        "id": "string",
        "full_name": "string",
        "story": "string",
        "location": "string",
        "tags": ["string"],
        "photo_url": "string",
        "created_at": "number",
        "thanks_count": "number"
      }
    ]
  }
  ```
- **Error Responses**:
  - 401: Unauthorized
  - 404: User not found
  - 500: Internal server error

### Get User's Heroes

- **GET** `/api/users/:id/heroes`
- **Description**: Get all heroes created by a specific user
- **Success Response** (200):
  ```json
  [
    {
      "id": "string",
      "full_name": "string",
      "story": "string",
      "location": "string",
      "tags": ["string"],
      "photo_url": "string",
      "created_at": "number",
      "thanks_count": "number"
    }
  ]
  ```
- **Error Response**:
  - 500: Internal server error
