# TerraControl Developer Handbook

> Living document. This handbook is the single source of truth for TerraControl.

## Repository
https://github.com/SnakeFreak85/Python-Dashboard

# 1. Project Vision
TerraControl is a premium, mobile-first terrarium management platform. The application is fully dynamic. No animal groups, genera, food types or care intervals are hardcoded.

# 2. Core Rules
- Analyze the repository before every task.
- Never change repository files without explicit instruction.
- Always provide complete files.
- No snippets, placeholders or partial code.
- The user commits changes.
- After every 'Commited', immediately continue with the next logical task.
- Existing architectural decisions are binding.

# 3. Architecture
- Frontend: Vanilla JavaScript
- Backend: Firebase
- Database: Firestore
- File Storage: Firebase Storage
- Authentication: Firebase Auth
- Offline-first local store
- Cloud synchronization

# 4. Design (TC2)
- Premium appearance
- Mobile first
- Rounded cards
- Blue cards with green accents
- No comic style
- Consistent spacing and typography

# 5. Current Decisions
- Dynamic animal groups
- Dynamic genera
- Profile V4
- Public-ID system
- Individual feeding intervals per animal
- Individual weight intervals per animal
- AnimalEngine as central business logic

> This handbook will be continuously expanded and remains the single documentation file for the project.