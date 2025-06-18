# Backend API

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the backend root with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register/admin` — Register an admin (JSON: name, email, password)
- `POST /api/auth/register/candidate` — Register a candidate (multipart/form-data: name, email, password, resume)
- `POST /api/auth/login` — Login (JSON: email, password)

## Notes
- Candidate resumes are uploaded to Cloudinary.
- All user data is stored in MongoDB. 