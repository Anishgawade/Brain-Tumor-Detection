import sys
import numpy as np
sys.path.append('C:\\Users\\csidd\\OneDrive\\Desktop\\Brain_Tumor\\backend')
from model.loader import load_model_once, get_model
from services.prediction_service import _generate_gradcam

load_model_once()
try:
    m = get_model()
    print("Model Input Shape:", m.input_shape)
    img = np.zeros((1, 224, 224, 3), dtype=np.float32)
    heat = _generate_gradcam(img, m)
    print("Heatmap shape:", heat.shape)
    print("Heatmap mean:", np.mean(heat))
except Exception as e:
    import traceback
    traceback.print_exc()
