# Local Heroes API Documentation

Base URL: `https://localheroes.vercel.app`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

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
