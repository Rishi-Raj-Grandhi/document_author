# Document Author - AI-Powered Document Generation & Refinement Platform

A full-stack web application that leverages AI (LLM) to generate, refine, and manage Word documents and PowerPoint presentations. Built with React, FastAPI, and Supabase.
🌐 Deployment

The project is fully deployed and accessible online:

Frontend (React + Vite) hosted on Vercel:
👉 https://document-author.vercel.app/

Backend (FastAPI) hosted on Render:
👉 https://document-author.onrender.com
(it might take little time for the first operation you do , patience because render stops the application due to inactivity)
This deployment enables seamless communication between the FastAPI backend and the Vercel-hosted frontend using live APIs.
## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Database Schema](#database-schema)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **AI-Powered Document Generation**: Generate Word documents and PowerPoint presentations using LLM
- **AI Outline Suggestions**: Get AI-suggested sections/slides based on your topic
- **Section-Level AI Refinement**: Refine individual sections with natural language instructions (e.g., "make it shorter", "make it more formal")
- **Version Control**: Automatic versioning for each refinement, preserving document history
- **Project Management**: Organize documents into projects with multiple versions
- **User Authentication**: Secure signup/login using Supabase Auth
- **Document Export**: Download generated documents as `.docx` or `.pptx` files
- **Feedback System**: Like/dislike and comment on specific sections
- **Real-time Updates**: Seamless project and version switching

### User Interface
- **Modern Dark Theme**: Beautiful, responsive UI built with Tailwind CSS
- **Interactive Workspace**: Intuitive project and version management
- **Modal-Based Workflows**: Streamlined document creation and refinement
- **Form/JSON Toggle**: Flexible input methods for document structure
- **Loading States**: Clear feedback during AI operations

## 🛠 Tech Stack

### Frontend
- **React 19.2.0**: UI library
- **Vite 7.2.4**: Build tool and dev server
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Axios 1.13.2**: HTTP client
- **Lucide React 0.554.0**: Icon library

### Backend
- **FastAPI 0.115.0**: Modern Python web framework
- **Uvicorn 0.30.6**: ASGI server
- **OpenAI 1.56.0**: LLM client for content generation
- **Supabase 2.3.4**: Backend-as-a-Service (database, auth)
- **Python-docx 1.1.2**: Word document generation
- **Python-pptx 0.6.23**: PowerPoint generation
- **Pydantic 2.9.2**: Data validation
- **Httpx 0.28.0**: Async HTTP client

### Database & Auth
- **Supabase PostgreSQL**: Database for projects, versions, and feedback
- **Supabase Auth**: User authentication and authorization

## 📁 Project Structure

```
document_author/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   ├── llm_client.py      # OpenAI client configuration
│   │   │   ├── settings.py        # Application settings
│   │   │   └── supabase_client.py  # Supabase client
│   │   ├── routes/
│   │   │   └── routes.py          # API endpoints
│   │   ├── services/
│   │   │   ├── docx_service.py           # Word document generation
│   │   │   ├── ppt_service.py            # PPT generation
│   │   │   ├── outline_service.py         # AI outline suggestions
│   │   │   ├── refinement_service.py     # AI section refinement
│   │   │   ├── document_export.py         # Word export
│   │   │   ├── ppt_export_service.py      # PPT export
│   │   │   └── project_service.py        # Project/version management
│   │   ├── utils/
│   │   │   └── auth.py            # Authentication utilities
│   │   └── main.py                # FastAPI application entry point
│   ├── requirements.txt           # Python dependencies
│   └── runtime.txt                # Python version specification
│
├── frontend/
│   └── my-react-app/
│       ├── src/
│       │   ├── components/
│       │   │   ├── LoginPage.jsx      # Authentication UI
│       │   │   └── WorkspacePage.jsx  # Main workspace UI
│       │   ├── services/
│       │   │   └── api.js             # API client (Axios)
│       │   ├── App.jsx                # Root component
│       │   ├── main.jsx               # Application entry point
│       │   └── index.css              # Global styles
│       ├── package.json               # Node.js dependencies
│       ├── vite.config.js             # Vite configuration
│       └── tailwind.config.js         # Tailwind CSS configuration
│
└── README.md                         # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** (check with `python --version`)
- **Node.js 18+** and **npm** (check with `node --version` and `npm --version`)
- **Supabase Account**: [Create one here](https://supabase.com)
- **OpenAI API Key**: [Get one here](https://platform.openai.com)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd document_author
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend/my-react-app

# Install dependencies
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

**How to get Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** (SUPABASE_URL)
4. Copy the **anon public** key (SUPABASE_ANON_KEY)
5. Copy the **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

### Frontend Configuration

The frontend uses a Vite proxy to connect to the backend. The proxy is configured in `frontend/my-react-app/vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

No additional frontend environment variables are required for development.

### Database Setup

You need to create the following tables in your Supabase database:

#### 1. Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doctype INTEGER NOT NULL, -- 0 = PPT, 1 = Word
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

#### 2. Project Versions Table

```sql
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_project_versions_is_current ON project_versions(is_current);
```

#### 3. Section Feedback Table

```sql
CREATE TABLE section_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  liked BOOLEAN,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(version_id, user_id, section_title)
);

CREATE INDEX idx_section_feedback_version_id ON section_feedback(version_id);
CREATE INDEX idx_section_feedback_user_id ON section_feedback(user_id);
```

#### 4. Auto-increment Version Number Trigger

Create a function and trigger to auto-increment version numbers:

```sql
-- Function to set version number
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM project_versions
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_set_version_number
BEFORE INSERT ON project_versions
FOR EACH ROW
EXECUTE FUNCTION set_version_number();
```

#### 5. Update is_current Trigger

Create a trigger to ensure only one version is current per project:

```sql
-- Function to update is_current
CREATE OR REPLACE FUNCTION update_is_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Set all other versions to false
  UPDATE project_versions
  SET is_current = FALSE
  WHERE project_id = NEW.project_id
    AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_is_current
AFTER INSERT ON project_versions
FOR EACH ROW
EXECUTE FUNCTION update_is_current();
```

## 🏃 Running the Application

### Start the Backend

```bash
cd backend

# Activate virtual environment (if not already active)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`
API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Start the Frontend

```bash
cd frontend/my-react-app

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the next available port)

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "user": { ... }
}
```

#### POST `/api/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",  // May be null if email confirmation required
  "user": { ... }
}
```

### Document Generation Endpoints

#### POST `/api/generate-word-json`
Generate a Word document.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "main_topic": "Introduction to Machine Learning",
  "sections": [
    "Overview",
    "History",
    "Applications",
    "Future Trends"
  ]
}
```

**Response:**
```json
{
  "message": "Word project successfully created",
  "project": { ... },
  "version": { ... },
  "content": { ... }
}
```

#### POST `/api/generate-ppt-json`
Generate a PowerPoint presentation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "topic": "Introduction to Machine Learning",
  "slides": [
    "Overview",
    "History",
    "Applications",
    "Future Trends"
  ]
}
```

**Response:**
```json
{
  "message": "PPT project successfully created",
  "project": { ... },
  "version": { ... },
  "content": { ... }
}
```

#### POST `/api/suggest-outline`
Get AI-suggested outline (sections or slides).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "topic": "Introduction to Machine Learning",
  "doc_type": "word"  // or "ppt"
}
```

**Response:**
```json
{
  "message": "Outline suggested successfully",
  "sections": ["Section 1", "Section 2", ...]  // or "slides" for PPT
}
```

### Project Management Endpoints

#### GET `/api/projects/my`
Get all projects for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Projects fetched successfully",
  "projects": [ ... ]
}
```

#### GET `/api/projects/{project_id}/versions`
Get all versions for a project.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Versions fetched successfully",
  "project_id": "uuid",
  "versions": [ ... ]
}
```

#### GET `/api/projects/{project_id}/versions/{version_id}`
Get a specific version's content.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Version fetched successfully",
  "version": { ... }
}
```

#### GET `/api/projects/{project_id}/versions/{version_id}/download`
Download a document as `.docx` or `.pptx`.

**Headers:** `Authorization: Bearer <token>`

**Response:** Binary file download

### Refinement Endpoint

#### POST `/api/projects/{project_id}/versions/{version_id}/refine`
Refine a specific section/slide using AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "section_title": "Introduction",
  "refinement_prompt": "make it shorter and more concise"
}
```

**Response:**
```json
{
  "message": "Section refined and new version created successfully",
  "version": { ... },
  "content": { ... }
}
```

### Feedback Endpoints

#### POST `/api/projects/{project_id}/versions/{version_id}/feedback`
Submit like/dislike feedback for a section.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "section_title": "Introduction",
  "liked": true  // or false
}
```

#### POST `/api/projects/{project_id}/versions/{version_id}/comments`
Add or update a comment for a section.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "section_title": "Introduction",
  "comment": "This section needs more examples"
}
```

#### GET `/api/projects/{project_id}/versions/{version_id}/feedback`
Get all feedback for a version.

**Headers:** `Authorization: Bearer <token>`

## 📖 Usage Guide

### Creating a New Document

1. **Login/Signup**: Create an account or login
2. **New Project**: Click "New Project" button
3. **Choose Document Type**: Select "Word" or "PPT"
4. **Enter Topic**: Type your document topic
5. **AI Suggest (Optional)**: Click "AI Suggest" to get AI-generated sections/slides
6. **Add Sections/Slides**:
   - **Form Mode**: Add sections/slides one by one
   - **JSON Mode**: Paste JSON structure directly
7. **Generate**: Click "Generate" to create the document

### Refining a Section

1. **Select Project**: Choose a project from the sidebar
2. **Select Version**: Choose a version to refine
3. **AI Refinement**: Click the AI (✨) button on any section
4. **Enter Refinement Prompt**: Type instructions like:
   - "make it shorter"
   - "make it more formal"
   - "add more technical details"
   - "simplify the language"
5. **Refine**: Click "Refine with AI"
6. **New Version**: A new version is automatically created with the refined content

### Managing Projects

- **View Projects**: All your projects appear in the left sidebar
- **Switch Projects**: Click any project to view its versions
- **View Versions**: Click a version to see its content
- **Download**: Click the download button to export as `.docx` or `.pptx`
- **Feedback**: Use like/dislike and comment buttons to provide feedback

## 🗄️ Database Schema

### Projects Table
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `title` (TEXT): Project title
- `doctype` (INTEGER): 0 = PPT, 1 = Word
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time

### Project Versions Table
- `id` (UUID): Primary key
- `project_id` (UUID): Foreign key to projects
- `version_number` (INTEGER): Auto-incremented version number
- `config` (JSONB): Document content structure
- `is_current` (BOOLEAN): Whether this is the current version
- `created_at` (TIMESTAMP): Creation time

### Section Feedback Table
- `id` (UUID): Primary key
- `version_id` (UUID): Foreign key to project_versions
- `user_id` (UUID): Foreign key to auth.users
- `section_title` (TEXT): Title of the section/slide
- `liked` (BOOLEAN): Like/dislike status
- `comment` (TEXT): Comment text
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time

## 🔧 Development

### Backend Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run with specific host and port
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Access API docs
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### Frontend Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Structure

- **Services**: Business logic is separated into service classes
- **Routes**: API endpoints are defined in `routes.py`
- **Models**: Pydantic models for request/response validation
- **Utils**: Authentication and utility functions

## 🐛 Troubleshooting

### Backend Issues

**Import Errors:**
- Ensure virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

**Database Connection Errors:**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is active
- Check database tables are created correctly

**OpenAI API Errors:**
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key is valid and has credits
- Review rate limits

### Frontend Issues

**API Connection Errors:**
- Ensure backend is running on port 8000
- Check Vite proxy configuration in `vite.config.js`
- Verify CORS settings in backend

**Build Errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

**Styling Issues:**
- Verify Tailwind CSS is configured correctly
- Check `tailwind.config.js` content paths
- Ensure `index.css` includes Tailwind directives

### Common Issues

**"Invalid response format" during signup:**
- This is normal if email confirmation is enabled in Supabase
- User needs to confirm email before login

**Refinement not working:**
- Check OpenAI API key is valid
- Verify section title matches exactly
- Check backend logs for errors

**Version not switching:**
- Clear browser cache
- Check network tab for API errors
- Verify version data structure

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write clear commit messages
- Add comments for complex logic
- Test your changes before submitting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for LLM capabilities
- **Supabase** for backend infrastructure
- **FastAPI** for the excellent web framework
- **React** and **Vite** for the frontend framework
- **Tailwind CSS** for styling

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation at `/docs` endpoint

---

**Built with ❤️ using React, FastAPI, and AI**

