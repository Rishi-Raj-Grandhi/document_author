# app/services/docx_service.py

import json
from typing import List, Dict, Any
from app.config.llm_client import generate_text


class DocxService:
    """
    Generates structured JSON content for Word document creation.
    This JSON is later used by a DOCX builder service.
    """

    @staticmethod
    def create_word_content(main_topic: str, sections: List[str]) -> Dict[str, Any]:
        """
        Generates the document content in JSON format using the LLM.

        Parameters
        ----------
        main_topic : str
            The main title/topic of the document.
        sections : List[str]
            A list of section headings.

        Returns
        -------
        dict
            A structured JSON representation of the document content.
        """

        prompt = DocxService._build_prompt(main_topic, sections)
        llm_output = generate_text(prompt).strip()

        return DocxService._parse_llm_json(llm_output, main_topic)

    # ----------------------------------------------------------------------

    @staticmethod
    def _build_prompt(main_topic: str, sections: List[str]) -> str:
        """
        Internal: builds the LLM prompt for clean JSON output.
        """

        return f"""
You are a structured document generator AI.

Generate ONLY valid JSON (no explanation, no markdown formatting).
The JSON should represent the content of a Word document.

MAIN TOPIC:
{main_topic}

SECTION HEADINGS:
{json.dumps(sections, indent=2)}

REQUIREMENTS:
- Produce a top-level "title"
- Produce a "blocks" list (sequence matters)
- First block MUST be a level-1 heading with the main topic
- For each section:
    - Add a level-2 heading
    - Add a detailed paragraph (5–7 sentences)
- Content must be original and coherent
- Return ONLY JSON. No extra text.

JSON FORMAT EXAMPLE:
{{
  "title": "Document Title",
  "blocks": [
    {{"type": "heading", "level": 1, "text": "Main Topic"}},
    {{"type": "heading", "level": 2, "text": "Section Heading"}},
    {{"type": "paragraph", "text": "Section content..."}}
  ]
}}
"""

    # ----------------------------------------------------------------------

    @staticmethod
    def _parse_llm_json(llm_output: str, main_topic: str) -> Dict[str, Any]:
        """
        Safely extracts and validates JSON returned from the LLM.
        Ensures the result always follows the expected structure.
        """

        # Fix: LLM may include extra text → isolate JSON
        try:
            cleaned = DocxService._extract_json(llm_output)
            data = json.loads(cleaned)
        except Exception:
            raise ValueError("LLM returned invalid JSON:\n" + llm_output)

        # Basic validations
        if "blocks" not in data or not isinstance(data["blocks"], list):
            raise ValueError("JSON missing 'blocks' list.")

        if "title" not in data:
            data["title"] = main_topic

        return data

    # ----------------------------------------------------------------------

    @staticmethod
    def _extract_json(text: str) -> str:
        """
        Extract only the JSON part from LLM output.
        Works even when LLM adds junk before/after.
        """

        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == -1:
            raise ValueError("No JSON object found in LLM output.")

        return text[start:end]


# Single shared instance (optional)
docx_service = DocxService()
