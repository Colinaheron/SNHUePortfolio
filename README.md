# Animal Shelter Dashboard

A web-based dashboard for managing and visualizing animal shelter data. This application allows users to filter animals by rescue type, view their locations on a map, and manage the shelter database.

## Features

- **Authentication System**
  - User roles: Admin, Analyst, and Viewer
  - Secure password hashing
  - Role-based access control

- **Interactive Dashboard**
  - Filter animals by rescue type:
    - Water Rescue
    - Mountain/Wilderness Rescue
    - Disaster/Individual Tracking
  - Interactive data table with selectable rows
  - Pie chart showing breed distribution
  - Interactive map showing animal locations

- **CRUD Operations** (Admin only)
  - Create new animal records
  - Update existing records
  - Delete records

## Setup

1. Clone the repository
2. Deploy to GitHub Pages or serve locally using a web server

### Local Development

For local development, you can use any web server. For example, with Python:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Usage

### Default Admin Account
- Username: admin
- Password: admin123

### Access Levels

1. **Admin**
   - Full access to all features
   - Can perform CRUD operations
   - Access to all data visualizations

2. **Analyst**
   - View and filter data
   - Access to data visualizations
   - Cannot modify data

3. **Viewer**
   - Basic view access
   - Cannot modify data

### Using the Dashboard

1. **Login/Register**
   - Use the default admin account or register a new user
   - Select appropriate role during registration

2. **Filtering Data**
   - Use the dropdown to select rescue type
   - Table will update automatically

3. **Viewing Details**
   - Click on any row to view location on map
   - Pie chart updates automatically based on filtered data

4. **Managing Records** (Admin only)
   - Use Create button to add new records
   - Select a row and use Update to modify
   - Select a row and use Delete to remove

## GitHub Pages Deployment

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "main" branch as source
4. Select root folder (/)
5. Save the settings

The site will be available at `https://[username].github.io/[repository-name]/`

## Data Structure

The dashboard uses local storage to maintain data persistence:
- Animal records
- User accounts
- Session information

## Technologies Used

- HTML5
- CSS3 with Bootstrap 5
- JavaScript (ES6+)
- Leaflet.js for mapping
- Chart.js for data visualization
