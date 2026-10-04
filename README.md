# MERN Chat App — Backend

A secure and production-ready backend for a real-time chat application built with **Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io, and Cloudinary**.

The backend provides authentication, protected REST APIs, real-time messaging, connection-based privacy, online presence, typing indicators, message status tracking, image uploads, pagination, and security middleware.

## ✨ Features

### Authentication & Security
- 🔐 JWT-based authentication
- 🍪 HTTP-only authentication cookies
- 🔒 Protected API routes
- 🔑 Password hashing with bcrypt
- 🔐 Authenticated Socket.io connections
- 🛡️ Helmet security headers
- 🚦 API rate limiting
- 🌐 Configurable CORS
- ⚠️ Request body size limits

### Real-Time Messaging
- 💬 Real-time one-to-one messaging with Socket.io
- 🟢 Online/offline user presence
- ⌨️ Typing indicators
- ✓ Sent, delivered, and read message status
- ✏️ Message editing
- 🗑️ Message deletion
- 📜 Message pagination
- 🔄 Load older messages

### Connection & Privacy
- 👥 User discovery
- 📩 Connection requests
- ✅ Accept connection requests
- ❌ Reject connection requests
- 🤝 Contact management
- 🚫 Block/unblock users
- 🔐 Connection-based chat authorization
- 🛡️ Protected message access
- 🔒 Socket communication authorization

### Media
- 🖼️ Image message support
- ☁️ Cloudinary image storage
- 📦 Image validation and upload limits

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **Socket.io**
- **JSON Web Token (JWT)**
- **bcrypt**
- **Cloudinary**
- **Helmet**
- **express-rate-limit**
- **cookie-parser**
- **CORS**

## 📁 Project Structure

```text
backend/
├── src/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5001

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

NODE_ENV=development

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit `.env` to Git. Production secrets should be configured through the deployment platform.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-backend-repository-url>
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env` and add your MongoDB, JWT, Cloudinary, and frontend configuration values.

### 4. Start development server

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5001
```

### 5. Start production server

```bash
npm start
```

## 🔌 API Routes

### Authentication

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/check
```

### Messages

```text
GET    /api/messages/users
GET    /api/messages/:id
POST   /api/messages/send/:id
PUT    /api/messages/read/:id
PUT    /api/messages/edit/:id
DELETE /api/messages/:id
```

### Connections

```text
POST   /api/connections/request
GET    /api/connections/requests
PUT    /api/connections/accept/:id
DELETE /api/connections/reject/:id

GET    /api/connections/contacts
DELETE /api/connections/contact/:id

PUT    /api/connections/block/:id
PUT    /api/connections/unblock/:id

GET    /api/connections/discover
```

All protected endpoints require an authenticated user session.

## 🔐 Authentication

Authentication is handled using JWT stored in an **HTTP-only cookie**.

Protected requests follow this flow:

1. Client sends the authentication cookie.
2. Backend verifies the JWT.
3. Authenticated user information is attached to the request.
4. Protected controllers verify the user's authorization.
5. The requested operation is processed only when access is allowed.

Socket.io connections also validate the JWT before establishing an authenticated connection.

## 🤝 Connection-Based Privacy

The application uses a connection system to control communication between users.

Users can:

- Discover other users
- Send connection requests
- Accept or reject requests
- View connected contacts
- Remove contacts
- Block users
- Unblock users

Messaging access is restricted to accepted connections.

This authorization is enforced on the backend rather than relying only on frontend UI restrictions.

## ⚡ Real-Time Communication

Socket.io handles real-time functionality including:

- New messages
- Online/offline presence
- Typing indicators
- Message delivery updates
- Message read updates
- Message editing
- Message deletion

Socket authentication and connection-based authorization help prevent unauthorized real-time communication.

## 🛡️ Security

The backend includes multiple security measures:

- JWT authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Helmet security headers
- API rate limiting
- Configurable CORS
- Protected API routes
- Authenticated Socket.io connections
- Connection-based authorization
- Environment-based secrets
- Request body size limits

## 🗄️ Database

MongoDB is used as the primary database with Mongoose for schema definition and database operations.

### Main Models

- **User** — authentication and profile information
- **Message** — chat messages, images, status, sender and receiver information
- **Connection** — connection requests, accepted connections, and blocking information

## ☁️ Image Uploads

Images are uploaded through the backend and stored using **Cloudinary**.

The backend validates image uploads before sending them to Cloudinary.

Cloudinary credentials are configured through environment variables and are never committed to the repository.

## 📜 Message Pagination

The backend supports paginated message retrieval to avoid loading an entire conversation at once.

Older messages can be requested using the oldest loaded message as a reference.

This improves performance for longer conversations.

## 🧪 Testing

The application has been manually tested for:

### Authentication
- User registration
- User login
- Invalid credentials
- Email validation
- Password validation
- Logout
- Session persistence
- Protected routes
- JWT authentication

### Messaging
- Sending and receiving messages
- Online/offline presence
- Typing indicators
- Delivered status
- Read status
- Message editing
- Message deletion
- Image sharing
- Pagination

### Connections & Privacy
- User discovery
- Sending connection requests
- Accepting requests
- Rejecting requests
- Contact management
- Removing contacts
- Blocking users
- Unblocking users
- Unauthorized chat access prevention
- Socket authorization

### Production
- CORS configuration
- Rate limiting
- Production authentication
- Production API requests
- Production Socket.io connection
- Production deployment

## 🌐 Deployment

The backend is deployed on **Render**.

The frontend is deployed separately on **Vercel**.

Production configuration is handled through environment variables, allowing the same backend codebase to run in both development and production environments.

## 👨‍💻 Author

**Sharan Poojari**

Full-Stack / MERN Developer

## 📌 Project Purpose

Built as a portfolio project to demonstrate practical full-stack development skills including:

- REST API development
- Authentication and authorization
- MongoDB and Mongoose
- Real-time communication with Socket.io
- Connection-based privacy
- Cloud image storage
- API security
- Production deployment

---

**Built with Node.js, Express.js, MongoDB, Socket.io, React, and Cloudinary.**
