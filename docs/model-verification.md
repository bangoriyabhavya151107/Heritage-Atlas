# Gemini model and SDK verification

Verified against Google's official Gemini Developer API documentation on **2026-11-02**. Model identifiers remain environment settings; the application does not hardcode them in provider calls.

## Configured model identifiers

- `GEMINI_MODEL=gemini-3.8-flash`. Google's model catalog lists Gemini 3.8 Flash as stable, and its API endpoint is `gemini-3.8-flash`. The same date's pricing page lists standard input and output as free of charge on the Free tier.[1] [2]
- `EMBEDDING_MODEL=gemini-embedding-2`. Google's model catalog lists Gemini Embedding 2 as stable. The embedding guide shows the Python SDK call `client.models.embed_content(model="gemini-embedding-2", ...)` and supports configurable output dimensions from 128 to 3072; 768, 1536 and 3072 are recommended. The project uses 768 to match Postgres `vector(768)`. Google's current pricing page lists text input as free of charge on the Free tier.[1] [3] [2]
- The two configured models are currently compatible with the no-paid-API requirement on the published Free tier. This does not guarantee that an individual Google project has quota or access at demo time. No grounding or other paid tool is enabled.

## Data handling and implementation

The pricing page marks free-tier requests to both configured models as content that may be used to improve Google's products; its Paid tier says otherwise. The project must not switch to paid usage to avoid this rule. Do not upload sensitive or restricted source material to the free Gemini service without permission. The product's privacy page also discloses third-party AI processing.[2] [4]

The pinned Python distribution is `google-genai==2.34.0`; the adapter uses `from google import genai` and `from google.genai import types`. Google's structured-output documentation supports JSON MIME output and a response schema. The provider validates the returned object again with the project's Pydantic `ExtractedFields` model.[5] The adapter sets per-request HTTP timeouts to 30 seconds using the SDK's millisecond timeout value.

The `.env.example` selects `AI_PROVIDER=gemini` for real runs. Tests inject `FakeAIProvider` directly, so the fake provider does not silently stand in for production calls. Before a demo, check Google's live model availability, free quotas and pricing again; if the required calls are not available within the free tier, stop rather than incur charges.

## References

[1]: https://ai.google.dev/gemini-api/docs/models "Gemini API model catalog"
[2]: https://ai.google.dev/gemini-api/docs/pricing "Gemini Developer API pricing"
[3]: https://ai.google.dev/gemini-api/docs/embeddings "Gemini API embeddings"
[4]: https://ai.google.dev/gemini-api/terms "Gemini API terms"
[5]: https://ai.google.dev/gemini-api/docs/generate-content/structured-output "Gemini API structured outputs"
