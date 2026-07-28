from ultralytics import YOLO
import os
import json

model_path = r'c:\xampp\htdocs\urosmatttt_backend\models\urosmart_model.tflite'

try:
    model = YOLO(model_path, task='detect')
    print("Model Names:", model.names)
except Exception as e:
    print(f"Error: {e}")
