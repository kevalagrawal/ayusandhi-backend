# AYUSandhi Backend API

![AYUSandhi Logo](https://img.shields.io/badge/AYUSandhi-Backend-4CAF50?style=for-the-badge&logo=node.js&logoColor=white)

## Overview

AYUSandhi Backend is a comprehensive Node.js API service that provides Ayurvedic medical terminology management, document analysis, and image processing capabilities. The service bridges traditional Ayurvedic wisdom with modern medical standards through advanced OCR processing, terminology mapping, and ICD-11 compliance.

## Table of Contents

- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [API Routes Documentation](#api-routes-documentation)
- [Controllers](#controllers)
- [Models](#models)
- [Utilities](#utilities)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## Architecture

### Technology Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer for multipart form data
- **Image Processing**: Cloudinary integration
- **OCR Services**: OCR.Space API integration
- **Authentication**: API key-based security
- **Deployment**: Vercel-ready with dynamic port assignment

### Project Structure
```
ayusandhi-backend/
├── controllers/          # Request handlers and business logic
│   ├── imageController.js
│   └── ocrController.js
├── models/              # Database schemas
│   └── Terminology.js
├── routes/              # API route definitions
│   ├── terminology.js
│   ├── scanRoute.js
│   └── regenerateRoute.js
├── utils/               # Utility functions and services
│   ├── cloudinaryService.js
│   ├── conditionExtractor.js
│   └── ocrService.js
├── index.js             # Main server file
├── package.json         # Dependencies and scripts
└── README.md           # This documentation
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Cloudinary account
- OCR.Space API key

### Installation Steps

1. **Clone and Install Dependencies**
```bash
cd ayusandhi-backend
npm install
```

2. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ayusandhi

# Cloudinary Configuration
CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# OCR Service
OCR_API_KEY1=your_ocr_space_api_key

# API Configuration
LIVE_TERMINOLOGY_API=https://ayusandhi-backend.vercel.app
PORT=5000
```

3. **Start Development Server**
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in PORT environment variable).

## API Routes Documentation

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://ayusandhi-backend.vercel.app`

### Route Categories

#### 1. Public Routes (No Authentication Required)

##### Health Check
```http
GET /
GET /health
```
**Description**: Server health and status check
**Response**: 
```json
{
  "status": "ok"
}
```

#### 2. Terminology Management Routes (`/api/v1/terminology`)

##### Search Terminology
```http
GET /api/v1/terminology/search?query={search_term}
```
**Description**: Search for medical terminology using natural language queries
**Parameters**:
- `query` (string, required): Search term (minimum 2 characters)

**Response**:
```json
{
  "query": "fever",
  "total_results": 1,
  "results": [
    {
      "namaste_code": "AYUR001",
      "display_name": "Jwara (Fever)",
      "english_name": "Fever",
      "hindi_name": "ज्वर",
      "category": "Symptoms",
      "medical_system": "Ayurveda"
    }
  ]
}
```

**Search Logic**:
- Case-insensitive regex search across multiple fields
- Searches in: `display_name`, `english_name`, `hindi_name`, `synonyms`
- Returns array of matching terminology records

##### Lookup Terminology
```http
GET /api/v1/terminology/lookup/{namaste_code}
```
**Description**: Get detailed information for a specific NAMASTE code
**Parameters**:
- `code` (string, required): NAMASTE terminology code

**Response**:
```json
{
  "namaste_code": "AYUR001",
  "display_name": "Jwara (Fever)",
  "english_name": "Fever",
  "hindi_name": "ज्वर",
  "definition": "Elevated body temperature due to dosha imbalance",
  "clinical_features": ["Increased body temperature", "Fatigue"],
  "dosha_involvement": {
    "primary": "Pitta",
    "secondary": ["Vata"]
  },
  "icd11_mappings": {
    "tm2_code": "TM2.001",
    "biomedicine_code": "R50.9"
  },
  "status": "active",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `404`: Code not found
- `500`: Internal server error

##### Bulk Data Seeding
```http
POST /api/v1/terminology/seed
```
**Description**: Insert bulk terminology data for database initialization
**Body**: Array of terminology objects
**Response**:
```json
{
  "message": "Dummy data inserted successfully",
  "count": 150
}
```

##### Delete All Records
```http
DELETE /api/v1/terminology/deleteAll
```
**Description**: Remove all terminology records from database
**Response**:
```json
{
  "message": "All records deleted",
  "deletedCount": 150
}
```

#### 3. Secure Routes (API Key Required)

##### Document Scanning
```http
POST /api/v2/scan/report
```
**Description**: Upload and analyze medical documents with automatic terminology extraction
**Authentication**: API key required in header
**Headers**:
- `apikey`: Your API key
- `Content-Type`: multipart/form-data

**Body**:
- `file`: Document file (PDF, PNG, JPG, JPEG, max 20MB)

**Response**:
```json
{
  "success": true,
  "fileName": "medical_report.pdf",
  "detectedCondition": "Past Jwara",
  "namasteCode": "AYUR001",
  "icdCode": "R50.9",
  "updatedText": "Patient shows signs of Past Jwara\nNAMASTE Code: AYUR001\nWHO ICD Code: R50.9",
  "updatedImageUrl": "https://res.cloudinary.com/...",
  "downloadUrl": "https://res.cloudinary.com/...",
  "extractedText": "Patient shows signs of Past Jwara...",
  "rawText": "Patient shows signs of Past Jwara...",
  "processingTime": "2.3s",
  "metadata": {
    "isErroredOnProcessing": false,
    "processingTimeInMs": 2300,
    "ocrExitCode": 1,
    "parsedPages": 1
  }
}
```

**Process Flow**:
1. File validation and upload
2. OCR text extraction via OCR.Space
3. Condition detection using regex patterns
4. Terminology API lookup for code mapping
5. Image annotation via Cloudinary
6. Response formatting with metadata

##### Image Regeneration
```http
POST /api/v2/regenerate-image
```
**Description**: Add NAMASTE and ICD codes as overlays to existing images
**Authentication**: API key required in header
**Headers**:
- `apikey`: Your API key
- `Content-Type`: application/json

**Body**:
```json
{
  "imagePath": "/path/to/image.jpg",
  "namasteCode": "AYUR001",
  "icdCode": "R50.9"
}
```

**Response**:
```json
{
  "success": true,
  "originalFile": "image.jpg",
  "namasteCode": "AYUR001",
  "icdCode": "R50.9",
  "updatedImageUrl": "https://res.cloudinary.com/...",
  "downloadUrl": "https://res.cloudinary.com/..."
}
```

## Controllers

### `imageController.js`

#### `regenerateImage(req, res)`
**Purpose**: Add medical codes as text overlays to existing images
**Process**:
1. Validates `imagePath` parameter
2. Checks file existence locally
3. Calls Cloudinary service to add text overlays
4. Returns processed image URLs

**Error Handling**:
- `400`: Missing imagePath or file not found
- `500`: Cloudinary processing errors

### `ocrController.js`

#### `handleScanReport(req, res)`
**Purpose**: Complete document analysis pipeline with OCR and terminology mapping
**Process**:
1. Validates uploaded file
2. Performs OCR text extraction
3. Extracts medical conditions using regex patterns
4. Maps conditions to NAMASTE codes via terminology API
5. Retrieves ICD-11 mappings
6. Generates annotated images with codes
7. Returns comprehensive analysis results

**Key Features**:
- Performance timing with `process.hrtime.bigint()`
- Automatic file cleanup after processing
- Graceful error handling for external API failures
- Comprehensive response with metadata

**Error Handling**:
- `400`: No file uploaded
- `502`: OCR service errors
- `500`: Internal processing errors

## Models

### `Terminology.js` - Database Schema

#### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `namaste_code` | String | ✅ | Unique identifier for terminology |
| `display_name` | String | ❌ | Human-readable display name |
| `hindi_name` | String | ❌ | Hindi translation |
| `english_name` | String | ❌ | English translation |
| `medical_system` | String | ❌ | Medical system classification |
| `category` | String | ❌ | Primary category |
| `subcategory` | String | ❌ | Secondary category |
| `definition` | String | ❌ | Clinical definition |
| `synonyms` | [String] | ❌ | Alternative names |
| `severity_levels` | [String] | ❌ | Severity classifications |
| `dosha_involvement` | Object | ❌ | Ayurvedic dosha analysis |
| `dosha_involvement.primary` | String | ❌ | Primary dosha |
| `dosha_involvement.secondary` | [String] | ❌ | Secondary doshas |
| `icd11_mappings` | Object | ❌ | International classification |
| `icd11_mappings.tm2_code` | String | ❌ | TM2 classification code |
| `icd11_mappings.tm2_display` | String | ❌ | TM2 display name |
| `icd11_mappings.biomedicine_code` | String | ❌ | Biomedicine code |
| `icd11_mappings.biomedicine_display` | String | ❌ | Biomedicine display |
| `who_international_terminology` | Object | ❌ | WHO terminology standards |
| `who_international_terminology.code` | String | ❌ | WHO code |
| `who_international_terminology.display` | String | ❌ | WHO display name |
| `who_international_terminology.definition` | String | ❌ | WHO definition |
| `clinical_features` | [String] | ❌ | Clinical characteristics |
| `traditional_symptoms` | [String] | ❌ | Traditional Ayurvedic symptoms |
| `hierarchy` | Object | ❌ | Parent-child relationships |
| `parent_code` | String | ❌ | Parent terminology code |
| `child_codes` | [String] | ❌ | Child terminology codes |
| `last_updated` | Date | ❌ | Last modification timestamp |
| `status` | String | ❌ | Active/inactive status |

#### Indexes
- **Primary Index**: `namaste_code` (unique)

## Utilities

### `cloudinaryService.js`

#### `addCodesToImage(localImagePath, namasteCode, icdCode)`
**Purpose**: Upload image to Cloudinary and add medical codes as text overlays
**Parameters**:
- `localImagePath` (string, required): Path to local image file
- `namasteCode` (string, optional): NAMASTE terminology code
- `icdCode` (string, optional): WHO ICD-11 code

**Process**:
1. Uploads original image to Cloudinary
2. Applies text overlay transformations
3. Returns original and transformed URLs

**Text Overlay Configuration**:
- Font: Arial, 24px, semi-bold
- Position: South-east corner
- Colors: Black text
- Two-line format: NAMASTE Code and WHO ICD Code

**Returns**:
```json
{
  "original": "https://res.cloudinary.com/...",
  "transformed": "https://res.cloudinary.com/..."
}
```

### `conditionExtractor.js`

#### `extractCondition(text)`
**Purpose**: Extract medical conditions from OCR text using pattern matching
**Parameters**:
- `text` (string): Raw OCR text

**Pattern Matching**:
1. **"Past" Pattern**: Matches "Past [condition]" format
   - Regex: `/Past\s+([A-Za-z\s()]+)/i`
   - Cleans up parentheses and commas
   
2. **Label Pattern**: Matches "Diagnosis/Condition/Disease: [value]" format
   - Regex: `/(?:Diagnosis|Condition|Disease)\s*[:\-]\s*(.+)/i`
   - Stops at line breaks or code markers

**Returns**: Extracted condition string or `null` if no match found

### `ocrService.js`

#### `performOcr(filePath)`
**Purpose**: Extract text from documents using OCR.Space API
**Parameters**:
- `filePath` (string): Path to uploaded file

**OCR Configuration**:
- Engine: OCR.Space Engine 2 (enhanced accuracy)
- Scale: Enabled for better resolution
- Table Detection: Enabled for structured data
- Orientation Detection: Auto-detect text orientation
- Language: English
- File Type: PDF (for better processing)

**Process**:
1. Creates FormData with file stream
2. Sends request to OCR.Space API
3. Validates response and exit codes
4. Formats extracted text for readability
5. Returns structured data with metadata

**Text Formatting Features**:
- Line cleanup and spacing normalization
- Medical document pattern recognition
- Colon spacing standardization
- Extra line break removal

**Returns**:
```json
{
  "extractedText": "Formatted text...",
  "rawText": "Original OCR text...",
  "ocrMetadata": {
    "isErroredOnProcessing": false,
    "processingTimeInMs": 2300,
    "ocrExitCode": 1,
    "parsedPages": 1
  }
}
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ayusandhi` |
| `CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-secret-key` |
| `OCR_API_KEY1` | OCR.Space API key | `your-ocr-api-key` |
| `LIVE_TERMINOLOGY_API` | Terminology API base URL | `https://ayusandhi-backend.vercel.app` |
| `PORT` | Server port (optional) | `5000` |

### Optional Environment Variables
- `NODE_ENV`: Environment mode (`development`, `production`)
- `CORS_ORIGIN`: Custom CORS origins (default: configured origins)

## Deployment

### Vercel Deployment

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings (auto-detected for Node.js)

2. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure MongoDB URI is accessible from Vercel

3. **Deploy**
   - Automatic deployment on push to main branch
   - Manual deployment available in Vercel dashboard

### Local Production Build

```bash
# Install production dependencies
npm install --production

# Start production server
node index.js
```

## Error Handling

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| `200` | Success | Successful operations |
| `400` | Bad Request | Invalid parameters, missing files |
| `401` | Unauthorized | Missing or invalid API key |
| `404` | Not Found | Terminology code not found |
| `500` | Internal Server Error | Server errors, database issues |
| `502` | Bad Gateway | External service errors (OCR, Cloudinary) |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Error Scenarios

1. **File Upload Errors**:
   - Invalid file type
   - File size exceeds 20MB limit
   - Missing file in request

2. **Authentication Errors**:
   - Missing API key
   - Invalid API key format

3. **External Service Errors**:
   - OCR.Space API failures
   - Cloudinary upload errors
   - MongoDB connection issues

4. **Data Validation Errors**:
   - Missing required parameters
   - Invalid data formats
   - Database constraint violations

## Contributing

### Development Guidelines

1. **Code Style**:
   - Use consistent indentation (2 spaces)
   - Follow JavaScript ES6+ standards
   - Add JSDoc comments for functions

2. **Error Handling**:
   - Implement comprehensive try-catch blocks
   - Provide meaningful error messages
   - Log errors for debugging

3. **Testing**:
   - Test all API endpoints
   - Validate error scenarios
   - Check file upload limits

4. **Security**:
   - Validate all input parameters
   - Sanitize file uploads
   - Implement proper API key validation

### API Development Standards

1. **Route Structure**:
   - Use RESTful conventions
   - Implement proper HTTP methods
   - Include versioning in URLs

2. **Response Format**:
   - Consistent JSON structure
   - Include success/error indicators
   - Provide helpful metadata

3. **Documentation**:
   - Update README for new endpoints
   - Include parameter descriptions
   - Provide example requests/responses

---

**AYUSandhi Backend API** - Bridging Traditional Ayurvedic Wisdom with Modern Healthcare Standards

*Developed in collaboration with the Ministry of AYUSH and National Digital Health Mission*

For support and questions, contact: [api@ayusandhi.gov.in](mailto:api@ayusandhi.gov.in)
