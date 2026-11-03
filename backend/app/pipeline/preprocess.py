import logging

import cv2
import numpy as np

from app.pipeline.context import PipelineContext, PipelineError

logger = logging.getLogger(__name__)


def preprocess(context: PipelineContext) -> PipelineContext:
    """Resize, grayscale, denoise, threshold, and deskew while retaining original bytes."""
    try:
        raw = np.frombuffer(context.image_bytes, dtype=np.uint8)
        image = cv2.imdecode(raw, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("image bytes could not be decoded")
        height, width = image.shape[:2]
        longest = max(height, width)
        if longest > 2000:
            scale = 2000.0 / longest
            image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
        inverted = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        coords = cv2.findNonZero(inverted)
        if coords is not None and len(coords) > 20:
            angle = cv2.minAreaRect(coords)[-1]
            angle = -(90.0 + angle) if angle < -45.0 else -angle
            if abs(angle) > 1.0:
                center = (denoised.shape[1] / 2.0, denoised.shape[0] / 2.0)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                image_height, image_width = denoised.shape[:2]
                denoised = cv2.warpAffine(denoised, matrix, (image_width, image_height), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        if min(denoised.shape[:2]) >= 3:
            block_size = min(31, min(denoised.shape[:2]) if min(denoised.shape[:2]) % 2 == 1 else min(denoised.shape[:2]) - 1)
            if block_size >= 3:
                processed = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, 11)
            else:
                processed = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        else:
            processed = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        success, encoded = cv2.imencode(".png", processed)
        if not success:
            raise ValueError("OpenCV could not encode the processed image")
        context.processed_image_bytes = encoded.tobytes()
        return context
    except Exception as exc:
        logger.exception("Image preprocessing failed for record %s", context.record_id)
        raise PipelineError("preprocess", f"Image preprocessing failed: {exc}") from exc
