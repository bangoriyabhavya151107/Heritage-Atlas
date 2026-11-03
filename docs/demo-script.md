# Heritage Atlas — 2–3 minute demo script

| Time | On-screen action | Spoken line |
|---|---|---|
| 0:00–0:15 | Open the landing page and choose **Start with a scan**. | “Field notes often begin as a photograph and local-language text, then disappear into decks and folders. Heritage Atlas keeps the evidence attached to a searchable place.” |
| 0:15–0:35 | On `/upload`, select a real JPEG/PNG/WebP scan, enter a place name, and choose a location on the map. Click **Send to review**. | “I’ll add one image, name the place, and set its map point. The upload is validated and the source goes to private Storage.” |
| 0:35–1:00 | Show the review URL. Let the status stepper move through `uploaded`/`processing` stages; point out polling and the current stage. | “The API starts the background pipeline. It preprocesses the image, runs OCR, proposes structured fields and translation, creates an embedding, and saves checkpoints. The review page follows the status instead of pretending the work is instant.” |
| 1:00–1:30 | When `needs_review` appears, inspect the draft. Edit title, type, period, features, language, summary, or place fields and save. | “This is a draft, not a publication decision. I compare the suggestions with the source and correct the fields. Completed stages are checkpointed, so a failed run can resume from its saved stage.” |
| 1:30–1:45 | Click **Approve**. | “When the record is checked, I approve it explicitly. The pipeline never auto-approves.” |
| 1:45–2:10 | Open **Explore the atlas**. Point to the new approved pin and open its detail panel. | “Approved records are returned as GeoJSON and appear on the map. I can open the detail panel to see the place, structured description, citation or uncertainty notes, and record context.” |
| 2:10–2:35 | Use search with `stepwells with carved pillars`; optionally filter by type. Open a result. | “Semantic search looks beyond an exact title. The API ranks approved records by embedding similarity and adds a short explanation from matching fields. Search and map results are restricted to approved records.” |
| 2:35–2:50 | Return to the record or credits page if needed. | “The prototype is deliberately honest: OCR and AI can be wrong, the seed images are placeholders, and a private source image is accessed with a short-lived signed URL. Human review remains the important step.” |

## Recording notes

Use a configured Supabase project and Gemini free-tier setup for the real upload demo. Do not show secrets. If demonstrating only the UI, say that the live upload requires those external services; do not imply that a disconnected screen processed a record.
