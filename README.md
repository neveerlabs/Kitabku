# Kitabku 🕌

**Kitabku** (My Book) is an Indonesian-language religious education web application designed to provide accessible knowledge about Islamic teachings (Fikih, Hadats, etc.) and essential daily religious features like prayer times and adzan reminders.

![Kitabku Interface Overlay](img/logo.png)

## ✨ Key Features

- **📖 Digital Kitab Repository**: Access a structured list of religious discussions across various categories (Haid, Nifas, Wudhu, Shalat, etc.).
- **🕌 Prayer Times (Adzan)**: Smart prayer time calculation based on your geographic location using the `PrayTimes.js` library.
- **🔊 Smart Reminders**: Built-in audio alerts for:
  - **Alarm**: Notification 15 minutes before prayer time.
  - **Sapa**: A brief reminder just before adzan.
  - **Adzan**: Full adzan audio when the time arrives.
- **🎯 Interactive Content**: Custom markup to link text directly to source kitab (Arabic texts) via modal popups.
- **🛡️ Privacy First**: Geolocation data is stored locally (`localStorage`) and encrypted (Base64). No data is sent to external servers.

## 🚀 Tech Stack

- **Front-end**: Vanilla HTML5, CSS3, JavaScript (ES6).
- **Icons**: Font Awesome 6.
- **Typography**: Google Fonts (Amiri, Inter).
- **Libraries**:
  - `PrayTimes.js`: Custom implementation for accurate prayer calculations.
  - `OpenStreetMap/Nominatim`: For reverse geocoding (to show your city name).

## 📂 Project Structure

```text
/
├── .github/          # CI/CD workflows
├── id/               # Multi-page content (daftar.html, artikel.html)
├── js/               # Application logic
│   ├── data.js       # Core content data and custom markup configuration
│   ├── script.js     # Main application logic (modals, prayer times, audio)
│   ├── kitab.js      # Modal kitab logic
│   └── PrayTimes.js  # Prayer calculation engine
├── css/              # Stylesheets
├── img/              # Visual assets
├── sound/            # Audio files (adzan.mp3, alarm.mp3, sapa.mp3)
├── docker/           # Docker configuration
│   └── Dockerfile    # Multi-arch compatible Dockerfile
└── index.html        # Landing page
```

## 🐳 Docker

You can run Kitabku in a containerized environment using Docker.

### Building Locally
To build the image locally, run the following command from the project root:
```bash
docker build -t kitabku -f docker/Dockerfile .
```

### Running with Docker Compose
This project provides two Compose configurations:

- **Ready-to-use (Production/Registry)**: Pulls the latest image from GHCR.
  ```bash
  docker compose -f docker/compose.yaml up -d
  ```

- **Local Development (Build)**: Builds the image from local source code.
  ```bash
  docker compose -f docker/compose-build.yaml up -d
  ```
Then visit `http://localhost:8080`.

### CI/CD with GitHub Actions
This project includes a GitHub Action (`.github/workflows/docker-build.yml`) that automatically builds and pushes the image to Docker Hub on every push to the `main` branch. It supports both **AMD64** and **ARM64** architectures.

To enable this for your repository:
1. Set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in your repository secrets.
2. The image will be pushed to `your_username/kitabku`.

## 🛠️ Content Management

### Adding New Content
Content is managed in `js/data.js`. You can add new categories or topics by following the established schema:

```javascript
categories: {
    sholat: {
        title: "Bab Sholat",
        topics: [
            {
                id: "rukun-sholat",
                title: "Rukun Sholat",
                content: "...",
                tags: [...]
            }
        ]
    }
}
```

### Custom Markup Tools
The application uses a custom parser for interactive elements within the `content` string:
- `((Button Text))`: Creates a button that opens a specific Arabic text in a modal.
- `**Highlighted Text**`: Applies a soft yellow background.
- `!!Note Text!!`: Creates an italicized note block with a left border.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**M. Syalman Al Farizi**
- Instagram: [@neveerlabs](https://instagram.com/neveerlabs)
- GitHub: [@neveerlabs](https://github.com/neveerlabs)
- Email: neveerlabs@gmail.com

---
*Note: This project is currently in development and revision phase.*
