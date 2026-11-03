from __future__ import annotations

from scripts.seed_demo_records import deterministic_id, load_records, main, search_document


def test_seed_manifest_has_five_sourced_records_with_uncertainty_notes() -> None:
    """Each curated entry has a citeable source, reviewed facts and explicit caveats."""
    records = load_records()

    assert len(records) == 5
    assert len({record["seed_key"] for record in records}) == 5
    assert all(record["source"].startswith("https://") for record in records)
    assert all(record["verified_facts"] and record["unverified"] for record in records)
    assert all(record["image_path"].startswith("seed-images/") for record in records)


def test_seed_ids_are_stable_and_unique() -> None:
    """Repeat runs upsert only the same deterministic IDs, never new duplicates."""
    keys = [record["seed_key"] for record in load_records()]
    ids = [deterministic_id(key) for key in keys]

    assert ids == [deterministic_id(key) for key in keys]
    assert len(set(ids)) == 5


def test_search_document_uses_the_production_field_sequence() -> None:
    """Seed vectors use title/type/period/materials/features/summary/English text."""
    record = {
        "title": "Sun Temple",
        "monument_type": "temple",
        "period": "11th century",
        "materials": ["sandstone"],
        "features": ["sacred pool", "carved sculpture"],
        "summary": "A temple complex.",
        "english_text": "A source transcription.",
    }

    document = search_document(record)

    assert document == "Sun Temple temple 11th century sandstone sacred pool, carved sculpture A temple complex. A source transcription."


def test_seed_script_defaults_to_a_local_dry_run(monkeypatch, capsys) -> None:
    """Calling without --apply performs no provider or database work."""
    monkeypatch.setattr("sys.argv", ["seed_demo_records.py"])

    result = main()
    output = capsys.readouterr().out

    assert result == 0
    assert "DRY RUN — no Gemini or Supabase requests were made." in output
    assert "--apply" in output
