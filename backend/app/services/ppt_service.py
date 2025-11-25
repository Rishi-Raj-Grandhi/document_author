# app/services/ppt_service.py

import json
from typing import List, Dict, Any
from app.config.llm_client import generate_text


class PptService:
    """
    Generates structured JSON content for PowerPoint presentations.
    This JSON is later used by a PPTX builder service.
    """

    @staticmethod
    def create_ppt_content(topic: str, slides: List[str]) -> Dict[str, Any]:
        """
        Creates the PPT content JSON using the LLM.

        Parameters
        ----------
        topic : str
            The overall presentation topic.
        slides : List[str]
            Slide headings/titles.

        Returns
        -------
        dict
            A structured JSON representing slide content.
        """

        prompt = PptService._build_prompt(topic, slides)
        llm_output = generate_text(prompt).strip()

        return PptService._parse_llm_json(llm_output)

    # ----------------------------------------------------------------------

    @staticmethod
    def _build_prompt(topic: str, slides: List[str]) -> str:
        """
        Internal: builds the LLM prompt to generate PPTX JSON.
        """

        return f"""
You are an AI presentation generator.

Generate ONLY valid JSON (no markdown, no explanation).
The JSON should represent the content for a PowerPoint presentation.

PRESENTATION TOPIC:
{topic}

SLIDE TITLES:
{json.dumps(slides, indent=2)}

REQUIREMENTS:
- JSON must contain:
    - "topic": string
    - "slides": list of slide objects
- Each slide object must contain:
    - "title": slide title
    - "bullets": list of 3–6 bullet points (short, crisp, clear)
- Keep language simple and presentation-friendly.
- NO extra text outside JSON.
- NO markdown.

JSON FORMAT EXAMPLE:

{{
  "topic": "Sample Presentation",
  "slides": [
    {{
      "title": "Introduction",
      "bullets": [
        "Point one",
        "Point two",
        "Point three"
      ]
    }}
  ]
}}
"""

    # ----------------------------------------------------------------------

    @staticmethod
    def _parse_llm_json(llm_output: str) -> Dict[str, Any]:
        """
        Extract and validate JSON returned from LLM for PPT content.
        """

        try:
            cleaned_json = PptService._extract_json(llm_output)
            data = json.loads(cleaned_json)
        except Exception as e:
            raise ValueError(f"LLM returned invalid JSON:\n{llm_output}") from e

        # Validations
        if "slides" not in data or not isinstance(data["slides"], list):
            raise ValueError("JSON missing 'slides' list.")

        for slide in data["slides"]:
            if "title" not in slide:
                raise ValueError("Each slide must contain a 'title'.")
            if "bullets" not in slide or not isinstance(slide["bullets"], list):
                raise ValueError("Each slide must contain 'bullets' list.")

        return data

    # ----------------------------------------------------------------------

    @staticmethod
    def _extract_json(text: str) -> str:
        """
        Extract only the JSON object from the LLM output.
        """

        start = text.find("{")
        end = text.rfind("}") + 1

        if start == -1 or end == -1:
            raise ValueError("No JSON found in LLM output.")

        return text[start:end]


# Optional instance
ppt_service = PptService()
