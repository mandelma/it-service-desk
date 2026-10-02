# Manual API Test Cases

## IT Service Desk

This document contains manual API test cases for the IT Service Desk backend.

Current API under test:

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

Testing tool: Postman

---

## User API

Base endpoint: `http://localhost:3000/api/users`

---

### TC-USER-001 — Get all users

**Method:** GET  
**Endpoint:** `/api/users`

#### Preconditions

- Backend server is running.
- PostgreSQL database is available.

#### Steps

1. Open Postman.
2. Create a GET request.
3. Send request to `/api/users`.

#### Expected result

- HTTP status is `200 OK`.
- Response body contains an array of users.
- Password field is not included in the response.

#### Status

PASS

---

### TC-USER-002 — Create user with valid data

**Method:** POST  
**Endpoint:** `/api/users`

#### Request body

```json
{
  "name": "Maria",
  "email": "maria@mail.ee",
  "password": "test12345"
}
```

#### Expected result

- HTTP status is `201 Created`.
- New user is created in the database.
- Response contains the created user's data.
- Default role is `USER`.
- Password is not included in the response.
- Password stored in the database is hashed.

#### Status

PASS

---

### TC-USER-003 — Create user with missing required field

**Method:** POST  
**Endpoint:** `/api/users`

#### Request body

```json
{
  "name": "Maria",
  "email": "maria2@mail.ee"
}
```

The `password` field is missing.

#### Expected result

- HTTP status is `400 Bad Request`.
- User is not created.
- Response contains validation information.

```json
{
  "message": "Invalid user data",
  "errors": [...]
}
```

#### Status

PASS

---

### TC-USER-004 — Create user with duplicate email

**Method:** POST  
**Endpoint:** `/api/users`

#### Preconditions

A user with email `maria@mail.ee` already exists.

#### Request body

```json
{
  "name": "Maria Test",
  "email": "maria@mail.ee",
  "password": "test12345"
}
```

#### Expected result

- HTTP status is `409 Conflict`.
- Duplicate user is not created.
- Response contains:

```json
{
  "message": "User with this email already exists"
}
```

#### Status

PASS

---

### TC-USER-005 — Internal server error handling

**Method:** POST  
**Endpoint:** `/api/users`

#### Test setup

Temporarily force an exception inside the controller:

```ts
throw new Error("Test server error");
```

#### Expected result

- HTTP status is `500 Internal Server Error`.
- API does not expose the stack trace to the client.
- Error details are logged on the server.
- Response contains:

```json
{
  "message": "Failed to create user"
}
```

#### Status

PASS

---

### TC-USER-006 — Reject invalid user data

**Method:** POST  
**Endpoint:** `/api/users`

#### Request body

```json
{
  "name": "M",
  "email": "maria@mail",
  "password": "test12"
}
```

#### Expected result

- HTTP status is `400 Bad Request`.
- User is not created.
- Validation errors are returned for invalid fields.
- Response contains:

```json
{
  "message": "Invalid user data",
  "errors": [...]
}
```

#### Status

PASS

### TC-USER-007 - Get user by not existing ID

**Method:** GET
**Endpoint:** `/api/users/123`

#### Preconditions

- User with ID `123` does not exist in the database.


#### Expected result

- HTTP status is `404 Not Found`.
- No user data is returned.
- Response contains:

```json
{
    "message": "User not found"
}
```

#### Status

PASS

### TC-USER-008 - Get user with invalid ID format

**Method:** GET
**Endpoint:** `/api/users/abc`

#### Preconditions

User id does contain as number

#### Expected result

- HTTP status is `400 Bad Request`
- Database lookup is not performed with an invalid ID.
- Response contains:

```json
{
    "message": "Invalid user ID",
    "errors": [...]
}
```

#### Status

PASS

### TC-USER-009 - Get user by existing ID

**Method:** GET
**Endpoint:** `/api/users/1`

#### Preconditions

- User with ID 1 exists in the database.

#### Expected result

- HTTP status is `200 OK`
- Correct user is returned.
- Password field is not included in the response.
- Response contains user data similar to:

```json
{
    "id":1,"name":"Maria",
    "email":"maria@mail.ee",
    "role":"USER",
    "createdAt":"2026-09-14T09:20:24.679Z",
    "updatedAt":"2026-09-14T09:20:24.679Z"
}
```

#### Status 

PASS

### TC-USER-010 — Update user with valid data

**Method:** PATCH  
**Endpoint:** `/api/users/<uuid>`

#### Preconditions

- User with the given UUID exists in the database.

#### Request body

```json
{
  "name": "Maria Updated",
  "role": "TECHNICIAN"
}
```

#### Expected result

- HTTP status is `200 OK`.
- User data is updated successfully.
- Fields not included in the request remain unchanged.
- Password field is not included in the response.
- Response contains the updated user data.

#### Status

PASS

---

### TC-USER-011 — Update user with invalid data

**Method:** PATCH  
**Endpoint:** `/api/users/<uuid>`

#### Preconditions

- User with the given UUID exists in the database.

#### Request body

```json
{
  "name": "M",
  "role": "SUPERADMIN"
}
```

#### Expected result

- HTTP status is `400 Bad Request`.
- User data is not updated.
- Response contains validation information.

```json
{
  "message": "Invalid user data",
  "errors": [...]
}
```

#### Status

PASS

---

### TC-USER-012 — Update user with empty request body

**Method:** PATCH  
**Endpoint:** `/api/users/<uuid>`

#### Request body

```json
{}
```

#### Expected result

- HTTP status is `400 Bad Request`.
- User data is not updated.
- Response contains:

```json
{
  "message": "No fields provided for update"
}
```

#### Status

PASS

---

### TC-USER-013 — Update user with non-existing ID

**Method:** PATCH  
**Endpoint:** `/api/users/<non-existing-uuid>`

#### Preconditions

- No user exists with the supplied UUID.

#### Request body

```json
{
  "role": "TECHNICIAN"
}
```

#### Expected result

- HTTP status is `404 Not Found`.
- No user data is updated.
- Response contains:

```json
{
  "message": "User not found"
}
```

#### Status

PASS

---

### TC-USER-014 — Update user with invalid ID format

**Method:** PATCH  
**Endpoint:** `/api/users/abc`

#### Request body

```json
{
  "role": "TECHNICIAN"
}
```

#### Expected result

- HTTP status is `400 Bad Request`.
- Database update is not performed.
- Response contains validation information.

```json
{
  "message": "Invalid user ID",
  "errors": [...]
}
```

#### Status

PASS

---

### TC-USER-015 — Delete existing user

**Method:** DELETE  
**Endpoint:** `/api/users/<uuid>`

#### Preconditions

- User with the supplied UUID exists in the database.

#### Steps

1. Send a DELETE request to `/api/users/<uuid>`.
2. Verify the response status.
3. Send a GET request for the same user.

#### Expected result

- DELETE request returns `204 No Content`.
- Response body is empty.
- User is removed from the database.
- A subsequent GET request for the same UUID returns `404 Not Found`.

#### Status

PASS

---

### TC-USER-016 — Delete non-existing user

**Method:** DELETE  
**Endpoint:** `/api/users/<non-existing-uuid>`

#### Preconditions

- No user exists with the supplied UUID.

#### Expected result

- HTTP status is `404 Not Found`.
- No data is deleted.
- Response contains:

```json
{
  "message": "User not found"
}
```

#### Status

PASS

---

### TC-USER-017 — Delete user with invalid ID format

**Method:** DELETE  
**Endpoint:** `/api/users/abc`

#### Expected result

- HTTP status is `400 Bad Request`.
- Database delete operation is not performed.
- Response contains validation information.

```json
{
  "message": "Invalid user ID",
  "errors": [...]
}
```

#### Status

PASS


## Ticket API

### TC-TICKET-001 – Create ticket successfully

**Method:** POST  
**Endpoint:** `/api/tickets`

**Request body:**

```json
{
  "title": "Printer problem",
  "description": "Office printer does not print",
  "priority": "HIGH",
  "createdById": "<valid-user-uuid>"
}
```

#### Expected result:

- Status: `201 Created`
- Ticket is created
- Default status is OPEN
- Response contains createdBy
- assignedTo is null


#### Status

PASS

### TC-TICKET-002 – Create ticket with technician assigned

**Method:*** POST
**Endpoint:** `/api/tickets`

**Request body:**

```json
{
  "title": "Network problem",
  "description": "User cannot connect to the network",
  "priority": "CRITICAL",
  "createdById": "<valid-user-uuid>",
  "assignedToId": "<valid-technician-uuid>"
}
```

#### Expected result

- Status: `201 Created`
- Ticket is created
- assignedTo contains the technician

#### Status

PASS


### TC-TICKET-003 – Reject invalid ticket data

**Method:** POST
**Endpoint:** `/api/tickets`

**Request body:**

```json
{
  "title": "A",
  "description": "Bad",
  "createdById": "abc"
}
```
#### Expocted result:

- Status: `400 Bad Request`
- Validation errors are returned

#### Status

PASS


### TC-TICKET-004 – Reject assignment to normal user

**Method:** POST
**Endpoint:** `/api/tickets`

Use a valid assignedToId belonging to a user with role USER.

#### Expected result

- Status: `400 Bad Request`
- Ticket is not created

#### Status

PASS


### TC-TICKET-005 – Get all tickets

**Method:** GET
**Endpoint:** `/api/tickets`

**Expected result:**

- Status: `200 OK`
- Response is an array
- Tickets contain createdBy
- Assigned tickets contain assignedTo

#### Status

PASS

### TC-TICKET-006 – Get ticket by ID

**Method:** GET
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

**Expected result:**

- Status: `200 OK`
- Correct ticket is returned
- Response contains createdBy
- Response contains assignedTo

#### Status

PASS

### TC-TICKET-007 – Get non-existing ticket

**Method:** GET
**Endpoint:** `/api/tickets/<non-existing-valid-uuid>`

**Expected result:**

- Status: `404 NotFound`
- Message: Ticket not found

#### Status

PASS


### TC-TICKET-008 – Reject malformed ticket ID

**Method:** GET
**Endpoint:** `api/tickets/abc`

**Expected result:**

- Status: `400 Bad Request`

#### Status

PASS


### TC-TICKET-009 – Update ticket status

**Method:** PATCH
**Endpoint** `/api/tickets/<valid-ticket-uuid>`

#### Request body

```json
{
  "status": "IN_PROGRESS"
}
```

#### Ecpected result

- Status: `200 OK`
- Ticket status is IN_PROGRESS

#### Status

PASS


### TC-TICKET-010 – Update multiple ticket fields

**Method:** PATCH
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

#### Request body

```json
{
  "status": "WAITING",
  "priority": "HIGH",
  "title": "Updated printer problem"
}
```

#### Expected result

- Status: `200 OK`
- All provided fields are updated
- Other fields remain unchanged

#### Status

PASS


### TC-TICKET-011 – Assign technician to ticket

**Method:** PATCH
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

#### Request body

```json
{
  "assignedToId": "<valid-technician-uuid>"
}
```
#### Expected result

- Status: `200 OK`
- assignedTo contains the technician

#### Status

PASS


### TC-TICKET-012 – Remove technician from ticket

**Method:** PATCH
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

#### Request body

```json
{
  "assignedToId": null
}
```

#### Expected result

- Status: `200 OK`
- assignedToId is null
- assignedTo is null

#### Status

PASS


### TC-TICKET-013 – Reject empty PATCH request

**Method:** PATCH
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

#### Request body

```json
{}
```

#### Expected result

- Status: `400 Bad Request`
- Message: No fields provided for update

#### Status

PASS


### TC-TICKET-014 – Delete ticket

**Method:** DELETE
**Endpoint:** `/api/tickets/<valid-ticket-uuid>`

#### Expected result

- Status: `204 No Content`
- Response body is empty
- Ticket no longer exists

#### Status 

PASS


### TC-TICKET-015 – Delete non-existing ticket

**Method:** DELETE
**Endpoint:** `/api/tickets/<non-existing-valid-uuid>`

#### Expected result

- Status: `404 Not Found`
- Message: Ticket not found

#### Status

PASS


### TC-TICKET-016 – Reject malformed ID when deleting

**Method:** DELETE
**Endpoint:** `/api/tickets/abc`

#### Expected result

- Status: `400 Bad Request`

#### Status

PASS


# Authentication and Authorization Tests

These test cases verify JWT authentication and role-based authorization for the Ticket API.

---

## TC-AUTH-001 – Access Ticket API without authentication

**Endpoint:** `GET /api/tickets`

**Preconditions:**
- No Authorization header is provided.

**Steps:**
1. Send a GET request to `/api/tickets`.
2. Do not include a Bearer token.

**Expected result:**
- HTTP status: `401 Unauthorized`
- Response indicates that authentication is required.

**Result:** PASS

---

## TC-AUTH-002 – Access Ticket API with valid JWT

**Endpoint:** `GET /api/tickets`

**Preconditions:**
- User is logged in.
- A valid JWT token is available.

**Steps:**
1. Send a GET request to `/api/tickets`.
2. Add header:
   `Authorization: Bearer <token>`

**Expected result:**
- HTTP status: `200 OK`
- Ticket data is returned according to the authenticated user's permissions.

**Result:** PASS

---

## TC-AUTH-003 – Access Ticket API with invalid JWT

**Endpoint:** `GET /api/tickets`

**Steps:**
1. Send a GET request to `/api/tickets`.
2. Use an invalid Bearer token.

**Expected result:**
- HTTP status: `401 Unauthorized`
- Response indicates that the token is invalid or expired.

**Result:** PASS

---

## TC-AUTH-004 – USER sees only own tickets

**Endpoint:** `GET /api/tickets`

**Preconditions:**
- At least two USER accounts exist.
- Both users have created tickets.
- Request is authenticated as USER A.

**Steps:**
1. Send a GET request to `/api/tickets` using USER A's JWT.

**Expected result:**
- HTTP status: `200 OK`
- Only tickets created by USER A are returned.
- Tickets created by USER B are not returned.

**Result:** PASS

---

## TC-AUTH-005 – USER can access own ticket by ID

**Endpoint:** `GET /api/tickets/:id`

**Preconditions:**
- USER has created a ticket.
- Request is authenticated as the same USER.

**Steps:**
1. Send a GET request using the user's own ticket ID.

**Expected result:**
- HTTP status: `200 OK`
- Correct ticket is returned.

**Result:** PASS

---

## TC-AUTH-006 – USER cannot access another user's ticket

**Endpoint:** `GET /api/tickets/:id`

**Preconditions:**
- USER A and USER B exist.
- Ticket belongs to USER B.
- Request is authenticated as USER A.

**Steps:**
1. Send a GET request using USER B's ticket ID.

**Expected result:**
- HTTP status: `404 Not Found`
- Ticket data is not exposed.

**Result:** PASS

---

## TC-AUTH-007 – USER can update allowed fields on own ticket

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Ticket belongs to authenticated USER.

**Request body example:**
```json
{
  "title": "Updated ticket title",
  "priority": "HIGH"
}
```

**Expected result:**
- HTTP status: `200 OK`
- Allowed fields are updated.

**Result:** PASS

## TC-AUTH-008 – USER cannot update another user's ticket

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Ticket belongs to USER B.
- Request is authenticated as USER A.

**Steps:**

### Attempt to update USER B's ticket.

**Expected result:**

- HTTP status: `404 Not Found`
- Ticket is not modified.

**Result:** PASS


## TC-AUTH-009 – USER cannot change ticket status

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**

- Ticket belongs to authenticated USER.


### Request body:

```json
{
  "status": "RESOLVED"
}
```


**Expected result:**
- HTTP status: `403 Forbidden`
- Ticket status remains unchanged.

**Result:** PASS


## TC-AUTH-010 – USER cannot assign a ticket

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Ticket belongs to authenticated USER.

```json
{
  "assignedToId": "<technician-uuid>"
}
```

**Expected result:** 
- HTTP status: `403 Forbidden`
- Assignment is not changed.

**Result:** PASS


## TC-AUTH-011 – USER cannot remove ticket assignment

**Endpoint:** `PATCH /api/tickets/:id`

**Request body:** 

```json
{
  "assignedToId": null
}
```

**Expected result:**

- HTTP status: `403 Forbidden`
- Assignment is not changed.

**Result:** PASS

## TC-AUTH-012 – USER cannot delete ticket

**Endpoint:** `DELETE /api/tickets/:id`

**Preconditions:**
- Request is authenticated with a USER JWT.

**Steps:**
- Attempt to delete a ticket.

**Expected result:**

- HTTP status: `403 Forbidden`
- Ticket remains in the database.

**Result:** PASS


## TC-AUTH-013 – TECHNICIAN can assign an unassigned ticket to

**Endpoint:** `PATCH /api/tickets/:id/assign-to-me`

**Preconditions:**
- Ticket exists.
- assignedToId is null.
- Request is authenticated as TECHNICIAN.

**Steps:**
- Send the assign-to-me request.

**Expected result:** 
- HTTP status: `200 Ok`
- assignedToId becomes the authenticated technician's user ID.
- Ticket status becomes IN_PROGRESS.

**Result:** PASS


## TC-AUTH-014 – USER cannot use assign-to-me endpoint

**Endpoint:** `PATCH /api/tickets/:id/assign-to-me`

**Preconditions:**

- Request is authenticated as USER.

**Steps:**
- end the assign-to-me request.

**Expected result:**
- HTTP status: `403 Forbidden`
- Ticket assignment remains unchanged.

**Result:** PASS


## TC-AUTH-015 – Second TECHNICIAN cannot take an already assigned ticket

**Endpoint:** `PATCH /api/tickets/:id/assign-to-me`

**Preconditions:**
- Ticket is assigned to TECHNICIAN A.
- Request is authenticated as TECHNICIAN B.

**Steps:**
- TECHNICIAN B sends the assign-to-me request.

**Expected result:**
- HTTP status: `409 Conflict`
- Ticket remains assigned to TECHNICIAN A.

**Result:** PASS


## TC-AUTH-016 – TECHNICIAN can update status of assigned ticket

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Ticket is assigned to authenticated TECHNICIAN.

**Request body:**

```json
{
  "status": "RESOLVED"
}
```

**Expected result:**
- HTTP status: `200 OK`
- Ticket status is updated to RESOLVED.

**Result:** PASS


## TC-AUTH-017 – TECHNICIAN cannot update ticket assigned to another

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Ticket is assigned to TECHNICIAN A.
- Request is authenticated as TECHNICIAN B.

** Request body:**

```json
{
  "status": "RESOLVED"
}
```

**Expected result:**
- HTTP status: `403 Forbidden`
- Ticket remains unchanged.

**Result:** PASS


## TC-AUTH-018 – TECHNICIAN cannot modify restricted ticket fields

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**

- Ticket is assigned to authenticated TECHNICIAN.

**Request body example:**

```json
{
  "priority": "CRITICAL"
}
```

**Expected result:**
- HTTP status: `403 Forbidden`
- Restricted field is not modified.

**Result:** PASS


## TC-AUTH-019 – TECHNICIAN cannot delete ticket

**Endpoint:** `DELETE /api/tickets/:id`

**Preconditions:** 
- Request is authenticated as TECHNICIAN.

### Steps

- Attempt to delete a ticket.

**Expected result:**
- HTTP status: `403 Forbidden`
- Ticket remains in the database.

**Result:** PASS


## TC-AUTH-020 – ADMIN can access all tickets

**Endpoint:** `GET /api/tickets`

**Preconditions:**
- Tickets from multiple users exist.
- Request is authenticated as ADMIN.

### Steps:

- Send a GET request to /api/tickets.

**Expected result:**

- HTTP status: `200 OK`
- Tickets from all users are returned.

**Result:** PASS


## TC-AUTH-021 – ADMIN can update ticket

**Endpoint:** `PATCH /api/tickets/:id`

**Preconditions:**
- Request is authenticated as ADMIN.

**Request  body example:**

```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Expected result:**

- HTTP status: `200 OK`
- Ticket is updated successfully.

**Result:** PASS


## TC-AUTH-022 – ADMIN can delete ticket

**Endpoint:** `DELETE /api/tickets/:id`

**Preconditions:**
- Ticket exists.
- Request is authenticated as ADMIN.

### Steps

- Send DELETE request for the ticket.

**Expected result:**

- HTTP status: `204 No Content`
- Ticket is removed from the database.

**Result:** PASS