import tensorflow as tf
import os

model_path = r'c:\xampp\htdocs\urosmatttt_backend\models\urosmart_model.tflite'

if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
    exit(1)

try:
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print("Input details:", input_details)
    print("Output details:", output_details)
except Exception as e:
    print(f"Error: {e}")
