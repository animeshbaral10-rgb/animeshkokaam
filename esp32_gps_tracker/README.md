# ESP32 GPS → Pet Tracker Backend

This sketch sends GPS data from an ESP32 + NEO-6M to the Pet Tracker backend over WiFi. The backend stores locations in PostgreSQL and updates the map in real time.

## Hardware

- ESP32 dev board
- NEO-6M GPS module
- Wiring: NEO-6M TX → GPIO 16 (RX2), NEO-6M RX → GPIO 17 (TX2), VCC, GND

## Libraries (Arduino / PlatformIO)

- **TinyGPSPlus** by Mikal Hart
- **ArduinoJson** (for JSON body)
- WiFi and HTTPClient are built into the ESP32 Arduino core.

## Setup

### 1. Backend

You can leave `DEVICE_INGEST_API_KEY` unset in `backend/.env` – then `POST /locations/ingest` accepts any request (no API key). For a locked-down setup, set `DEVICE_INGEST_API_KEY=your-secret` and use the same value as `API_KEY` in the sketch.

### 2. Register the device in the app

1. Log in to the Pet Tracker app (http://localhost:3000).
2. Go to **Pets & Devices**.
3. Click **Register Device**.
4. Set **Device ID** to the same value you will use in the sketch (e.g. `ESP32-GPS-01`). This must match exactly.
5. Optionally link the device to a pet.

### 3. ESP32 config

In `esp32_gps_tracker.ino` set:

- `WIFI_SSID` / `WIFI_PASSWORD` – your WiFi.
- `BACKEND_URL` – backend base URL:
  - Same PC as backend: `http://192.168.1.x:3001` (use your PC’s LAN IP).
  - Or if you use the Next.js proxy: `http://192.168.1.x:3000/api` (then the request goes to Next, which forwards to the backend).
- `API_KEY` – leave `""` if you didn’t set `DEVICE_INGEST_API_KEY` in the backend; otherwise use the same value.
- `DEVICE_ID` – same as the Device ID you registered in the app (e.g. `ESP32-GPS-01`).

### 4. Upload and run

Upload the sketch, open Serial Monitor at 115200. When the GPS has a fix, the ESP32 will POST to `/locations/ingest` every 10 seconds. Locations appear in the app’s dashboard and history.

## API

- **URL:** `POST <BACKEND_URL>/locations/ingest`
- **Headers:** `Content-Type: application/json`, `X-Api-Key: <API_KEY>`
- **Body:** `{ "deviceId": "<DEVICE_ID>", "latitude": 12.34, "longitude": 56.78, "altitude": 100, "speed": 0.5, "satelliteCount": 8 }`

Optional fields: `altitude`, `accuracy`, `speed`, `heading`, `satelliteCount`, `batteryLevel`, `signalStrength`, `recordedAt` (ISO string).
