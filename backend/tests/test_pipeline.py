from pathlib import Path
from uuid import uuid4

from pytest import MonkeyPatch

from app.models.schemas import ExtractedFields
from app.pipeline.context import PipelineContext
from app.pipeline.embed import embed
from app.pipeline.extract import extract
from app.pipeline.ocr import ocr
from app.pipeline.preprocess import preprocess
from app.pipeline.save import save
from app.pipeline.translate import translate
from app.providers.base import ProviderFailure
from app.providers.fake import FakeAIProvider
from app.providers.ocr import OCRResult

FIXTURE = Path(__file__).parent / "fixtures" / "sample_page.png"


def test_preprocess_keeps_original_and_creates_processed_image() -> None:
    """Preprocessing returns a derived image without replacing original upload bytes."""
    original = FIXTURE.read_bytes()
    context = preprocess(PipelineContext(record_id=uuid4(), image_bytes=original, place_name="Sample site"))
    assert context.image_bytes == original
    assert context.processed_image_bytes is not None
    assert context.processed_image_bytes.startswith(b"\x89PNG")


def test_ocr_uses_provider_confidence_and_flags_low_text() -> None:
    """OCR confidence averages word scores and short results remain non-fatal."""

    class FakeOCR:
        def recognize(self, image_bytes: bytes, languages: str) -> OCRResult:
            assert languages == "eng+hin+guj"
            return OCRResult(words=["Short"], confidences=[71.0])

    context = PipelineContext(record_id=uuid4(), image_bytes=FIXTURE.read_bytes(), place_name="Sample", processed_image_bytes=FIXTURE.read_bytes())
    ocr(context, FakeOCR())
    assert context.original_text == "Short"
    assert context.ocr_confidence == 71.0
    assert context.has_text is False


def test_fake_provider_runs_extraction_translation_and_embedding() -> None:
    """The deterministic provider exercises AI-dependent stages without a key or network."""
    provider = FakeAIProvider()
    context = PipelineContext(
        record_id=uuid4(),
        image_bytes=FIXTURE.read_bytes(),
        place_name="Demo",
        original_text="આ વાવમાં કોતરણીવાળા સ્તંભો છે અને અનેક માળ છે.",
    )
    extract(context, provider)
    translate(context, provider)
    embed(context, provider)
    assert context.extracted is not None
    assert context.extracted.language == "Gujarati"
    assert context.english_text == context.original_text
    assert context.embedding is not None and len(context.embedding) == 768


def test_plain_photo_with_no_text_continues_to_review() -> None:
    """A no-text image uses place-name/image-aware extraction rather than failing OCR."""

    class EmptyOCR:
        def recognize(self, image_bytes: bytes, languages: str) -> OCRResult:
            return OCRResult(words=[], confidences=[])

    provider = FakeAIProvider()
    context = PipelineContext(record_id=uuid4(), image_bytes=FIXTURE.read_bytes(), place_name="Photo site", processed_image_bytes=FIXTURE.read_bytes())
    ocr(context, EmptyOCR())
    extract(context, provider)
    translate(context, provider)
    embed(context, provider)
    assert context.has_text is False
    assert context.extracted is not None
    assert context.summary == "Image submitted for Photo site."
    assert context.embedding is not None and len(context.embedding) == 768


def test_invalid_extraction_json_retries_then_degrades() -> None:
    """Invalid provider output is retried once and then marked for manual review."""

    class InvalidProvider(FakeAIProvider):
        def __init__(self) -> None:
            self.calls = 0

        def extract_fields(self, text: str, place_name: str, image_bytes: bytes, validation_error: str | None = None) -> object:
            self.calls += 1
            return "{not valid json"

        def translate(self, text: str) -> str:
            raise AssertionError("degraded extraction must not trigger speculative translation")

    provider = InvalidProvider()
    context = PipelineContext(record_id=uuid4(), image_bytes=b"image", place_name="Unknown")
    extract(context, provider)
    translate(context, provider)
    embed(context, provider)
    assert provider.calls == 2
    assert context.extracted is not None and context.extracted.confidence == 0.0
    assert context.extracted.title is None
    assert context.extraction_warning is not None
    assert context.embedding is not None and len(context.embedding) == 768


def test_save_sets_review_state_and_keeps_warning(monkeypatch: MonkeyPatch) -> None:
    """The save stage persists output for human review rather than approving it."""
    import app.pipeline.save as save_module

    updates: list[dict[str, object]] = []
    monkeypatch.setattr(save_module, "update_record", lambda _record_id, values: updates.append(values) or {"id": "row"})
    context = PipelineContext(record_id=uuid4(), image_bytes=b"image", place_name="Demo", embedding=[0.0] * 768)
    context.extracted = ExtractedFields(title="Demo", confidence=0.3)
    context.extraction_warning = "Needs human review"
    save(context)
    assert updates[0]["status"] == "needs_review"
    assert updates[0]["warning"] == "Needs human review"
    assert updates[0]["error"] is None


def test_extract_failure_keeps_ocr_checkpoint_and_marks_failed(monkeypatch: MonkeyPatch) -> None:
    """An extraction failure retains previously persisted OCR and sets failed status."""
    import app.services.pipeline_runner as runner

    record_id = uuid4()
    row = {"id": str(record_id), "image_path": "sample.png", "place_name": "Sample", "status": "uploaded"}
    updates: list[dict[str, object]] = []
    statuses: list[tuple[str, str, str | None]] = []

    class FailingProvider(FakeAIProvider):
        def extract_fields(self, text: str, place_name: str, image_bytes: bytes, validation_error: str | None = None) -> object:
            raise ProviderFailure("extraction", "provider temporarily unavailable")

    class FakeStorage:
        def download(self, object_path: str) -> bytes:
            return b"fake image"

        def upload(self, object_path: str, content: bytes, content_type: str) -> str:
            return object_path

    def fake_ocr(context: PipelineContext) -> PipelineContext:
        context.original_text = "Readable OCR text retained before extraction failure."
        context.ocr_confidence = 92.0
        return context

    monkeypatch.setattr(runner.record_db, "get_record", lambda _record_id: row)
    monkeypatch.setattr(runner.record_db, "get_client", lambda: object())
    monkeypatch.setattr(runner.record_db, "set_status", lambda _id, status, stage, error: statuses.append((status, stage, error)) or row)
    monkeypatch.setattr(runner.record_db, "update_record", lambda _id, values: updates.append(values) or row)
    monkeypatch.setattr(runner, "preprocess", lambda context: context)
    monkeypatch.setattr(runner, "ocr", fake_ocr)

    runner.run_pipeline(record_id, provider=FailingProvider(), storage=FakeStorage())
    assert any(update.get("original_text") == "Readable OCR text retained before extraction failure." for update in updates)
    assert statuses[-1][0:2] == ("failed", "extract")
    assert "provider temporarily unavailable" in (statuses[-1][2] or "")


def test_retry_resumes_at_failed_stage_and_finishes_review(monkeypatch: MonkeyPatch) -> None:
    """Retry skips earlier successful stages and finishes at needs_review."""
    import app.pipeline.save as save_module
    import app.services.pipeline_runner as runner

    record_id = uuid4()
    row = {
        "id": str(record_id), "image_path": "sample.png", "place_name": "Sample", "status": "failed",
        "pipeline_stage": "extract", "original_text": "A stone fort with two towers.", "ocr_confidence": 88.0,
    }
    statuses: list[tuple[str, str, str | None]] = []
    persisted: list[dict[str, object]] = []

    class FakeStorage:
        def download(self, object_path: str) -> bytes:
            return b"fake image"

        def upload(self, object_path: str, content: bytes, content_type: str) -> str:
            return object_path

    def fail_if_replayed(context: PipelineContext) -> PipelineContext:
        raise AssertionError("retry must not rerun preprocessing")

    monkeypatch.setattr(runner.record_db, "get_record", lambda _record_id: row)
    monkeypatch.setattr(runner.record_db, "get_client", lambda: object())
    monkeypatch.setattr(runner.record_db, "set_status", lambda _id, status, stage, error: statuses.append((status, stage, error)) or row)
    monkeypatch.setattr(runner.record_db, "update_record", lambda _id, values: persisted.append(values) or row)
    monkeypatch.setattr(save_module, "update_record", lambda _id, values: persisted.append(values) or row)
    monkeypatch.setattr(runner, "preprocess", fail_if_replayed)

    runner.run_pipeline(record_id, provider=FakeAIProvider(), storage=FakeStorage())
    assert statuses[0] == ("processing", "extract", None)
    assert statuses[-1] == ("processing", "save", None)
    assert any(values.get("status") == "needs_review" for values in persisted)
