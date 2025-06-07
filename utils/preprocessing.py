import cv2
from scipy.sparse.linalg import svds
import numpy as np

def to_grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def resize_image(image, scale):
    return cv2.resize(image, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

def preprocess_image_by_svd(image, k):
    h, w = image.shape
    max_k = min(h, w) - 1
    k = min(k, max_k)
    U, S, Vt = svds(image.astype(np.float32), k=k)

    idx = np.argsort(S)[::-1]
    U, S, Vt = U[:, idx], S[idx], Vt[idx, :]

    reconstructed = U @ np.diag(S) @ Vt
    reconstructed -= reconstructed.min()
    reconstructed /= reconstructed.max()
    reconstructed *= 255
    return reconstructed.astype(np.uint8)

def standard_preprocessing(image):
    grayscale_image = to_grayscale(image)
    resized_image = resize_image(grayscale_image, 1)
    after_svd_image = preprocess_image_by_svd(resized_image, 100)
    _, binary = cv2.threshold(after_svd_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary