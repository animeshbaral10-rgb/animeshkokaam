#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

// ============ CONFIGURATION ============
#define WIFI_SSID       "anjanabaral_2.4"
#define WIFI_PASSWORD   "9801036652Naya@"
#define BACKEND_URL     "https://pettracking-backend.onrender.com/locations/ingest"
#define DEVICE_ID       "ESP32-GPS-01"
#define SEND_INTERVAL   10000 

// GPS Pins
#define RXD2 16
#define TXD2 17

TinyGPSPlus gps;
HardwareSerial neogps(2);

unsigned long lastSendTime = 0;
unsigned long lastCharTime = 0; 

void setup() {
  Serial.begin(115200);
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected. IP: " + WiFi.localIP().toString());
}

void loop() {
  // Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(2000);
  }

  // Read GPS Hardware
  while (neogps.available() > 0) {
    char c = neogps.read();
    lastCharTime = millis(); // Update timer whenever any byte is received
    gps.encode(c);
  }

  // ROBUSTNESS: Hardware Disconnect Detection
  // If no bytes arrive for 3 seconds, the GPS module is likely disconnected
  if (millis() - lastCharTime > 3000) {
    static unsigned long lastErr = 0;
    if (millis() - lastErr > 5000) {
      Serial.println("!!! CRITICAL ERROR: GPS MODULE NOT DETECTED (Check Wiring) !!!");
      lastErr = millis();
    }
  }

  // Send Data if Fix is Valid and Interval has passed
  if (gps.location.isValid()) {
    if ((millis() - lastSendTime) >= SEND_INTERVAL) {
      lastSendTime = millis();
      sendLocationToBackend();
    }
  } else {
    // Optional: Print status while waiting for satellites
    static unsigned long lastStatus = 0;
    if (millis() - lastStatus >= 5000) {
      lastStatus = millis();
      if (millis() - lastCharTime < 3000) {
        Serial.printf("GPS Connected. Searching... Satellites: %d\n", gps.satellites.value());
      }
    }
  }
}

void sendLocationToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();  // Skip SSL cert verification (needed for Render's HTTPS)

  HTTPClient http;
  http.begin(client, BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);  // 15 second timeout (Render free tier can cold-start)

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["latitude"] = round(gps.location.lat() * 1e8) / 1e8;
  doc["longitude"] = round(gps.location.lng() * 1e8) / 1e8;
  
  if (gps.altitude.isValid()) doc["altitude"] = gps.altitude.meters();
  if (gps.speed.isValid()) doc["speed"] = round(gps.speed.kmph() * 100.0) / 100.0;
  if (gps.satellites.isValid()) doc["satelliteCount"] = gps.satellites.value();

  String body;
  serializeJson(doc, body);
  
  Serial.println("Sending Data: " + body);
  
  int code = http.POST(body);
  if (code > 0) {
    Serial.println("Response: " + String(code));
  } else {
    Serial.println("Error: " + http.errorToString(code));
  }
  http.end();
}