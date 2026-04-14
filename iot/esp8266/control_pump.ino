const int pumpPin = D1;

void setup() {
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);
}

void loop() {
  // Toggle pump based on incoming control signal
  delay(1000);
}
