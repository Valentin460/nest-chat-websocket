# Real-Time Chat App — Frontend (Next.js 15)

This repository contains the frontend of a real-time chat application built with **Next.js 15** and **TypeScript**.  
It communicates with the backend through WebSockets and REST for authentication.

## Technologies Used

- Next.js 15
- React
- TypeScript
- TailwindCSS (optional)
- WebSockets (client)
- Basic authentication flow

## Features

- Real-time chat interface
- Multiple rooms (create, join, leave)
- Token-based authentication
- Message list with live updates
- Clean and modern React structure

## Installation

```bash
pnpm install
pnpm dev
```

The frontend runs by default on:

```
http://localhost:3000
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Communication With Backend

- REST: authentication
- WebSockets: real-time chat

## Author

**Salim Njikam (Art Sider)**  
Web developer building modern real-time apps through practical learning.
