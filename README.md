# weighing-verification

This repository contains the backend and Flutter owner app for the weighing verification project.

## Included
- FastAPI backend in `backend/`
- Flutter owner application in `owner_app/`
- Firebase configuration and app logic for instrument verification

## Notes
- Sensitive files such as Firebase service account credentials and local `.env` values are intentionally ignored by Git.
- Use `flutter pub get` in `owner_app/` and `uvicorn main:app --reload` in `backend/` to run locally.
