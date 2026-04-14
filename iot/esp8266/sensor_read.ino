void setup() {
  Serial.begin(115200);
}

void loop() {
  int moisture = analogRead(A0);
  Serial.println(moisture);
  delay(1000);
}
