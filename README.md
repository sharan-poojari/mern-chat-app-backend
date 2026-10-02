\# MERN Chat App — Backend



A secure and scalable backend for a real-time chat application built with \*\*Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io, and Cloudinary\*\*.



The backend provides authentication, protected REST APIs, real-time messaging, online presence, typing indicators, message status tracking, image uploads, and security middleware.



\## ✨ Features



\- 🔐 JWT-based authentication

\- 🍪 HTTP-only authentication cookies

\- 🔒 Protected API routes

\- 💬 Real-time messaging with Socket.io

\- 🟢 Online/offline user presence

\- ⌨️ Typing indicators

\- ✓ Delivered and read message status

\- ✏️ Message editing

\- 🗑️ Message deletion

\- 🖼️ Image upload and sharing

\- 📜 Message pagination

\- 🔐 Socket.io authentication

\- 🛡️ Helmet security headers

\- 🚦 API rate limiting

\- 🌐 Configurable CORS

\- 🗄️ MongoDB database integration

\- ☁️ Cloudinary image storage

\- ⚠️ Centralized API error responses



\## 🛠️ Tech Stack



\- \*\*Node.js\*\*

\- \*\*Express.js\*\*

\- \*\*MongoDB\*\*

\- \*\*Mongoose\*\*

\- \*\*Socket.io\*\*

\- \*\*JSON Web Token (JWT)\*\*

\- \*\*bcrypt\*\*

\- \*\*Cloudinary\*\*

\- \*\*Helmet\*\*

\- \*\*express-rate-limit\*\*

\- \*\*cookie-parser\*\*

\- \*\*CORS\*\*



\## 📁 Project Structure



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



\## ⚙️ Environment Variables



Create a `.env` file in the backend root:



```env

PORT=5001

MONGO\_URI=your\_mongodb\_connection\_string

JWT\_SECRET=your\_jwt\_secret

NODE\_ENV=development

CLIENT\_URL=http://localhost:5173



CLOUDINARY\_CLOUD\_NAME=your\_cloud\_name

CLOUDINARY\_API\_KEY=your\_api\_key

CLOUDINARY\_API\_SECRET=your\_api\_secret

```



> Never commit `.env` to Git. The `.env` file should remain local and is excluded through `.gitignore`.



\## 🚀 Getting Started



\### 1. Clone the repository



```bash

git clone <your-backend-repository-url>

cd backend

```



\### 2. Install dependencies



```bash

npm install

```



\### 3. Configure environment variables



Create `.env` and add the required MongoDB, JWT, Cloudinary, and frontend configuration values.



\### 4. Start development server



```bash

npm run dev

```



The backend will run on:



```text

http://localhost:5001

```



\### 5. Start production server



```bash

npm start

```



\## 🔌 API Routes



\### Authentication



```text

POST /api/auth/signup

POST /api/auth/login

POST /api/auth/logout

GET  /api/auth/check

```



\### Messages



```text

GET    /api/messages/users

GET    /api/messages/:id

POST   /api/messages/send/:id

PUT    /api/messages/:id

DELETE /api/messages/:id

```



> Exact API behavior depends on the current application implementation.



\## 🔐 Authentication



Authentication is handled using JWT stored in an \*\*HTTP-only cookie\*\*.



Protected requests:



1\. Client sends the authentication cookie.

2\. Backend verifies the JWT.

3\. The authenticated user is attached to the request.

4\. Protected controllers can safely access the authenticated user's identity.



Socket.io connections also validate the JWT before establishing an authenticated socket connection.



\## ⚡ Real-Time Communication



Socket.io is used for real-time functionality including:



\- New messages

\- Online user presence

\- Typing indicators

\- Message delivery updates

\- Message read status



Socket authentication is performed before allowing a client connection.



\## 🛡️ Security



The backend includes several security measures:



\- JWT authentication

\- HTTP-only cookies

\- Password hashing with bcrypt

\- Helmet security headers

\- API rate limiting

\- Configurable CORS

\- Protected routes

\- Authenticated Socket.io connections

\- Environment-based secrets

\- Request body size limits



\## 🗄️ Database



MongoDB is used as the primary database with Mongoose for schema definition and database operations.



Main data models include:



\- User

\- Message



\## ☁️ Image Uploads



Images are uploaded through the backend and stored using \*\*Cloudinary\*\*.



Cloudinary credentials are configured through environment variables and are never committed to the repository.



\## 🧪 Testing Checklist



The backend has been manually tested for:



\- User registration

\- User login

\- Invalid credentials

\- Invalid email validation

\- Password validation

\- Logout/session handling

\- Protected routes

\- JWT authentication

\- Socket authentication

\- Real-time messages

\- Online presence

\- Typing indicators

\- Message editing

\- Message deletion

\- Image sharing

\- Pagination

\- API rate limiting

\- CORS configuration

\- Production startup



\## 🏗️ Production Readiness



The backend supports environment-based configuration for:



\- Server port

\- MongoDB connection

\- JWT secret

\- Frontend URL

\- Cloudinary credentials

\- Node environment



This allows the same backend codebase to be configured for both local development and production deployment.



\## 👨‍💻 Author



\*\*Sharan Poojari\*\*



Full-Stack / MERN Developer



\---



> Built as a portfolio project to demonstrate backend development, REST API design, authentication, MongoDB integration, real-time communication, cloud image storage, and application security.

