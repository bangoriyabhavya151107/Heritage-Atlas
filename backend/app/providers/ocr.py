from dataclasses import dataclass
from typing import Protocol

import cv2
import numpy as np
import pytesseract
from pytesseract import Output


@dataclass(frozen=True)
class OCRResult:
    """Recognized words and their valid per-word confidence percentages."""

    words: list[str]
    confidences: list[float]


class OCRProviderError(Exception):
    """A readable failure raised by a concrete OCR adapter."""


class OCRProvider(Protocol):
    """Interface for interchangeable OCR engines."""

    def recognize(self, image_bytes: bytes, languages: str) -> OCRResult:
        """Recognize words and confidence scores from processed image bytes."""
        ...


class TesseractOCRProvider:
    """Tesseract adapter using OpenCV image decoding and pytesseract image_to_data."""

    def recognize(self, image_bytes: bytes, languages: str) -> OCRResult:
        """Decode a processed image, invoke Tesseract, and return valid word scores."""
        try:
            image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
            if image is None:
                raise ValueError("processed image bytes could not be decoded")
            result = pytesseract.image_to_data(image, lang=languages, config="--psm 6", output_type=Output.DICT)
            words: list[str] = []
            confidences: list[float] = []
            for word, confidence_text in zip(result["text"], result["conf"], strict=True):
                cleaned = str(word).strip()
                if not cleaned:
                    continue
                words.append(cleaned)
                try:
                    confidence = float(confidence_text)
                except (TypeError, ValueError):
                    continue
                if confidence >= 0:
                    confidences.append(confidence)
            return OCRResult(words=words, confidences=confidences)
        except Exception as exc:
            raise OCRProviderError(f"Tesseract OCR failed: {exc}") from exc
