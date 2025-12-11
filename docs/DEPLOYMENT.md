# Rupee Rumble Deployment Guide

This guide details how to deploy the **Rupee Rumble** application.

## Phase 1: Preparation (Required for all methods)

Because this application uses TypeScript (`.tsx`) and Environment Variables (`process.env`), it must be compiled before deployment. We will use **Vite** to handle the build process.

### 1. Initialize the Project Structure
Create the following configuration files in your root directory to standardise the build process.

**1. Create `package.json`**
```json
{
  "name": "rupee-rumble",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

**2. Create `vite.config.ts`**
```ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
```

**3. Create `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

**4. Install Dependencies**
Run this command in your terminal:
```bash
npm install
```

---

## Option 1: Vercel CLI (No Git Required)

This is the best method if you cannot connect to GitHub. It uploads your files directly from your computer to Vercel.

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```

2.  **Login**:
    ```bash
    vercel login
    ```
    (Follow the instructions to log in via your browser).

3.  **Deploy**:
    Run the following command in your project folder:
    ```bash
    vercel
    ```

4.  **Follow the Prompts**:
    *   Set up and deploy? **Y**
    *   Which scope? **[Select your account]**
    *   Link to existing project? **N**
    *   Project name? **rupee-rumble**
    *   In which directory is your code located? **./** (Just press Enter)
    *   **Auto-detect settings**: Vercel should detect Vite. If asked for build command, use `npm run build`. If asked for output directory, use `dist`.

5.  **Set Environment Variables**:
    *   Go to the dashboard URL provided in the terminal (e.g., `https://vercel.com/your-name/rupee-rumble/settings`).
    *   Navigate to **Settings** > **Environment Variables**.
    *   Add Key: `API_KEY`, Value: `[Your Gemini API Key]`.
    *   **Redeploy**: You must redeploy for the key to take effect. Run:
        ```bash
        vercel --prod
        ```

---

## Option 2: Manual Upload to GitHub (Web Interface)

If you prefer to use the GitHub integration but cannot push code via terminal.

1.  **Prepare your files**:
    *   **Unzip your project first.** GitHub does not automatically unzip files.
    *   Ensure `package.json` is at the top level of your folder.
    *   **Do not** upload the `node_modules` folder.

2.  **Create Repository**:
    *   Go to [github.com/new](https://github.com/new).
    *   Name your repository (e.g., `rupee-rumble`).
    *   Click **Create repository**.

3.  **Upload Files**:
    *   On the repository setup page, look for the link **"uploading an existing file"**.
    *   Or, if the repo is created, click **Add file** > **Upload files**.
    *   **Drag and drop the contents**: Select all files and folders (src, components, package.json, etc.) inside your unzipped folder and drag them into the browser window.
    *   *Note: Ensure `package.json` is visible in the list of files to be committed, not inside a subfolder.*
    *   Commit the changes.

4.  **Deploy on Vercel**:
    *   Go to [vercel.com](https://vercel.com) > **Add New Project**.
    *   Import from your GitHub account (select the repo you just made).
    *   Add the `API_KEY` in Environment Variables.
    *   Click **Deploy**.

---

## Option 3: Deploy to Google Cloud Run

Cloud Run hosts stateless containers. This method requires Docker.

### 1. Create a `Dockerfile`
Create a file named `Dockerfile` (no extension) in the root directory:

```dockerfile
# Stage 1: Build the application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build args for API Key
ARG API_KEY
ENV API_KEY=$API_KEY

# Build the app
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for React Router
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Build and Deploy

Make sure you have the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed.

**Step A: Build the Image**
```bash
gcloud builds submit --tag gcr.io/[PROJECT_ID]/rupee-rumble \
  --substitutions=_API_KEY="[YOUR_API_KEY]" .
```

**Step B: Deploy to Cloud Run**
```bash
gcloud run deploy rupee-rumble \
  --image gcr.io/[PROJECT_ID]/rupee-rumble \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
