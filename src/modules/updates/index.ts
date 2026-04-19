"use server";
import { getUser } from "../auth/actions";
import db from "@/lib/db";
import { MessageRole } from "@prisma/client";
import { generateText } from "ai";
import { vertex, LIGHT_MODEL } from "@/lib/ai";

async function generateProjectName(prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: vertex(LIGHT_MODEL),
      temperature: 0.8,
      system:
        "You are a professional project naming assistant. Generate a unique, highly creative, and distinct 2-3 word project name based on the user's prompt. Avoid generic terms. Do not use quotes, periods, or extra words. Just the name.",
      prompt: `User Prompt: ${prompt}`,
    });
    return text.trim() || "Untitled Project";
  } catch (error) {
    console.error("Failed to generate project name:", error);
    return "Untitled Project";
  }
}

export const createProject = async (message: string) => {
  try {
    const user = await getUser();

    if (!user.success || !user.user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const initialFiles = {
      "package.json": {
        file: {
          contents: `{
  "name": "nextjs-webcontainer-template",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2"
  }
}`,
        },
      },

      "next.config.mjs": {
        file: {
          contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;
`,
        },
      },

      "tsconfig.json": {
        file: {
          contents: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "strict": true,
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
        },
      },

      "next-env.d.ts": {
        file: {
          contents: `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
        },
      },

      "postcss.config.cjs": {
        file: {
          contents: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
        },
      },

      "tailwind.config.ts": {
        file: {
          contents: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)"
      }
    }
  },
  plugins: []
};

export default config;
`,
        },
      },

      lib: {
        directory: {
          "utils.ts": {
            file: {
              contents: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
            },
          },
        },
      },

      components: {
        directory: {
          ui: {
            directory: {
              "button.tsx": {
                file: {
                  contents: `import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
`,
                },
              },

              "card.tsx": {
                file: {
                  contents: `import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white text-black shadow p-6",
        className
      )}
      {...props}
    />
  );
}
`,
                },
              },

              "input.tsx": {
                file: {
                  contents: `import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2",
        className
      )}
      {...props}
    />
  );
}
`,
                },
              },
            },
          },
        },
      },

      app: {
        directory: {
          "globals.css": {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}
`,
            },
          },

          "layout.tsx": {
            file: {
              contents: `import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
            },
          },

          "page.tsx": {
            file: {
              contents: `
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">Welcome</h1>
    </main>
  );
}
      `,
            },
          },
        },
      },
    };

    const projectName = await generateProjectName(message);

    const newProject = await db.project.create({
      data: {
        name: projectName,
        userId: user.user.id,
        files: initialFiles as unknown as string,
        messages: {
          create: {
            content: message,
            role: MessageRole.USER,
          },
        },
      },
    });
    return {
      success: true,
      message: "Project created successfully",
      project: newProject.id,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error creating project",
    };
  }
};

export const getProjectById = async (id: string, userId: number) => {
  try {
    const project = await db.project.findUnique({
      where: {
        id,
        userId: userId,
      },
    });
    return {
      success: true,
      message: "Project found successfully",
      project,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Project not found",
    };
  }
};

export const updateProjectFiles = async (id: string, files: string, userId: number) => {
  try {
    const project = await db.project.update({
      where: {
        id,
        userId: userId,
      },
      data: {
        files,
      },
    });
    return {
      success: true,
      message: "Project updated successfully",
      project,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Project not found",
    };
  }
};
