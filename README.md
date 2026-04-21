# Promptly

**Promptly** is an AI-powered coding environment and web IDE that allows developers to write, execute, and iterate on code seamlessly. Leveraging modern large language models and cloud containerization, Promptly accelerates the software development lifecycle by providing an intelligent, integrated workspace.

## 🚀 Features

- **Integrated Browser IDE:** High-performance code editor built on top of `Monaco Editor` featuring an integrated interactive terminal via `xterm.js`.
- **Cloud Sandboxing & Execution:** Execute code securely and natively in the browser using `WebContainer API` for real-time feedback and validation.
- **AI-Powered Generation:** Embedded AI pair programming utilizing the Vercel AI SDK, with support for Anthropic and Google Vertex AI models featuring real-time streaming responses.
- **Secure Authentication & Billing:** Comprehensive user management through Clerk, featuring an atomic, concurrency-safe token reservation system for accurate AI usage billing.
- **Resilient Rate Limiting:** Custom, production-hardened API rate limiting engine designed to mitigate abuse and secure edge-deployed serverless functions.

## 💻 Tech Stack

- **Framework:** Next.js 16 (App Router) & React 19
- **Languages:** TypeScript, Node.js
- **Database & ORM:** PostgreSQL paired with Prisma
- **Authentication:** Clerk
- **AI & ML Integration:** Vercel AI SDK (@ai-sdk/google)
- **Execution Environments:** WebContainers
- **UI & Styling:** Tailwind CSS 4, Shadcn / Radix UI 

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20+)
- Docker (for the local database container)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lav1shkumar/promptly.git
   cd promptly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the environment:**
   Create a `.env` file and populate it with your environment variables (Clerk keys, AI Model keys, database connection strings). 

4. **Boot up the local development environment:**
   The `dev` script automatically starts the requisite PostgreSQL Docker container and the Next.js development server.
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Navigate your browser to `http://localhost:3000`.

## 📄 License

This project is licensed under the MIT License.
