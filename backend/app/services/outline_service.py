# app/services/outline_service.py

import json
from typing import List, Dict, Any
from app.config.llm_client import generate_text


class OutlineService:
    """
    Service for generating document outlines (sections for Word, slides for PPT)
    using AI suggestions based on a topic.
    """

    @staticmethod
    def suggest_word_sections(topic: str) -> List[str]:
        """
        Suggests section headings for a Word document based on the topic.

        Parameters
        ----------
        topic : str
            The main topic of the document.

        Returns
        -------
        List[str]
            A list of suggested section headings.
        """
        prompt = OutlineService._build_word_prompt(topic)
        llm_output = generate_text(prompt).strip()
        return OutlineService._parse_sections(llm_output)

    @staticmethod
    def suggest_ppt_slides(topic: str) -> List[str]:
        """
        Suggests slide titles for a PowerPoint presentation based on the topic.

        Parameters
        ----------
        topic : str
            The main topic of the presentation.

        Returns
        -------
        List[str]
            A list of suggested slide titles.
        """
        prompt = OutlineService._build_ppt_prompt(topic)
        llm_output = generate_text(prompt).strip()
        return OutlineService._parse_slides(llm_output)

    # ----------------------------------------------------------------------

    @staticmethod
    def _build_word_prompt(topic: str) -> str:
        """
        Builds the LLM prompt for suggesting Word document sections.
        """
        return f"""
You are an AI assistant that helps create document outlines.

Given a topic, suggest 5-7 logical section headings for a Word document.

TOPIC: {topic}

REQUIREMENTS:
- Generate 5-7 section headings
- Sections should be logical and comprehensive
- Each section should be a clear, concise heading (2-6 words)
- Sections should flow logically from introduction to conclusion
- Return ONLY a JSON array of strings, no other text

EXAMPLE FORMAT:
["Introduction", "Background", "Main Analysis", "Key Findings", "Discussion", "Conclusion"]

Return ONLY the JSON array:
"""

    @staticmethod
    def _build_ppt_prompt(topic: str) -> str:
        """
        Builds the LLM prompt for suggesting PowerPoint slide titles.
        """
        return f"""
You are an AI assistant that helps create presentation outlines.

Given a topic, suggest 5-8 slide titles for a PowerPoint presentation.

TOPIC: {topic}

REQUIREMENTS:
- Generate 5-8 slide titles
- Slides should be logical and comprehensive
- Each slide title should be clear and concise (2-6 words)
- Slides should flow logically from introduction to conclusion
- Return ONLY a JSON array of strings, no other text

EXAMPLE FORMAT:
["Introduction", "Overview", "Key Points", "Details", "Analysis", "Conclusion"]

Return ONLY the JSON array:
"""

    # ----------------------------------------------------------------------

    @staticmethod
    def _parse_sections(llm_output: str) -> List[str]:
        """
        Parses the LLM output to extract section headings.
        Handles various formats the LLM might return.
        """
        try:
            # Try to extract JSON array
            cleaned = OutlineService._extract_json_array(llm_output)
            sections = json.loads(cleaned)
            
            if isinstance(sections, list) and all(isinstance(s, str) for s in sections):
                return [s.strip() for s in sections if s.strip()]
            else:
                raise ValueError("Invalid format: not a list of strings")
        except Exception as e:
            # Fallback: try to parse as plain text list
            try:
                lines = [line.strip() for line in llm_output.split('\n') if line.strip()]
                # Filter out markdown list markers and numbers
                cleaned_lines = []
                for line in lines:
                    # Remove markdown list markers (-, *, 1., etc.)
                    line = line.lstrip('- *').lstrip('0123456789.').strip()
                    if line and not line.startswith('[') and not line.startswith('{'):
                        cleaned_lines.append(line)
                
                if cleaned_lines:
                    return cleaned_lines[:8]  # Limit to 8 sections
            except:
                pass
            
            # Ultimate fallback
            raise ValueError(f"Failed to parse sections from LLM output: {llm_output}")

    @staticmethod
    def _parse_slides(llm_output: str) -> List[str]:
        """
        Parses the LLM output to extract slide titles.
        Uses the same logic as sections parsing.
        """
        return OutlineService._parse_sections(llm_output)

    @staticmethod
    def _extract_json_array(text: str) -> str:
        """
        Extracts a JSON array from text, handling various formats.
        """
        # Try to find JSON array
        start = text.find('[')
        end = text.rfind(']') + 1
        
        if start != -1 and end > start:
            return text[start:end]
        
        # If no array found, try to find JSON object with sections/slides key
        start = text.find('{')
        end = text.rfind('}') + 1
        
        if start != -1 and end > start:
            try:
                obj = json.loads(text[start:end])
                if 'sections' in obj:
                    return json.dumps(obj['sections'])
                elif 'slides' in obj:
                    return json.dumps(obj['slides'])
            except:
                pass
        
        raise ValueError("No JSON array found in output")


# Single shared instance
outline_service = OutlineService()

