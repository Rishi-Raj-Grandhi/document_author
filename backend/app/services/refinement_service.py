# app/services/refinement_service.py

import json
from typing import Dict, Any, List
from app.config.llm_client import generate_text


class RefinementService:
    """
    Service for refining individual sections of documents using AI.
    """

    @staticmethod
    def refine_word_section(section_blocks: List[Dict], refinement_prompt: str) -> List[Dict]:
        """
        Refines a Word document section (heading + paragraphs) based on user prompt.
        
        Parameters
        ----------
        section_blocks : List[Dict]
            List of blocks representing a section (heading + paragraphs)
        refinement_prompt : str
            User's refinement instruction (e.g., "make it shorter", "make it more formal")
        
        Returns
        -------
        List[Dict]
            Refined blocks for the section
        """
        # Extract heading and paragraphs
        heading = None
        paragraphs = []
        
        for block in section_blocks:
            if block.get("type") == "heading":
                heading = block
            elif block.get("type") == "paragraph":
                paragraphs.append(block)
        
        # Build prompt for refinement
        prompt = RefinementService._build_word_refinement_prompt(
            heading, paragraphs, refinement_prompt
        )
        
        llm_output = generate_text(prompt).strip()
        refined_blocks = RefinementService._parse_word_refinement(llm_output, heading)
        
        return refined_blocks

    @staticmethod
    def refine_ppt_slide(slide: Dict, refinement_prompt: str) -> Dict:
        """
        Refines a PowerPoint slide based on user prompt.
        
        Parameters
        ----------
        slide : Dict
            Slide object with title and bullets
        refinement_prompt : str
            User's refinement instruction
        
        Returns
        -------
        Dict
            Refined slide object
        """
        prompt = RefinementService._build_ppt_refinement_prompt(slide, refinement_prompt)
        llm_output = generate_text(prompt).strip()
        refined_slide = RefinementService._parse_ppt_refinement(llm_output, slide.get("title"))
        
        return refined_slide

    # ----------------------------------------------------------------------

    @staticmethod
    def _build_word_refinement_prompt(heading: Dict, paragraphs: List[Dict], prompt: str) -> str:
        """Builds the LLM prompt for refining a Word section."""
        
        heading_text = heading.get("text", "") if heading else ""
        heading_level = heading.get("level", 2) if heading else 2
        paragraph_texts = [p.get("text", "") for p in paragraphs]
        combined_text = "\n\n".join(paragraph_texts) if paragraph_texts else ""
        
        # Build heading line separately to avoid backslash in f-string
        heading_line = f"Heading: {heading_text}\n" if heading_text else ""
        
        return f"""
You are an AI writing assistant that refines document sections based on user instructions.

CURRENT SECTION:
{heading_line}Content:
{combined_text}

USER REFINEMENT INSTRUCTION:
{prompt}

REQUIREMENTS:
- Refine ONLY the paragraph content based on the user's instruction
- Keep the heading unchanged (same text and level: {heading_level})
- Maintain the same structure (heading followed by paragraphs)
- Return ONLY valid JSON, no explanation

Return the refined section as a JSON array of blocks:
[
  {{"type": "heading", "level": {heading_level}, "text": "{heading_text}"}},
  {{"type": "paragraph", "text": "refined paragraph content..."}}
]

Return ONLY the JSON array:
"""

    @staticmethod
    def _build_ppt_refinement_prompt(slide: Dict, prompt: str) -> str:
        """Builds the LLM prompt for refining a PPT slide."""
        
        title = slide.get("title", "")
        bullets = slide.get("bullets", [])
        
        return f"""
You are an AI presentation assistant that refines slides based on user instructions.

CURRENT SLIDE:
Title: {title}
Bullets:
{json.dumps(bullets, indent=2)}

USER REFINEMENT INSTRUCTION:
{prompt}

REQUIREMENTS:
- Refine the slide content based on the user's instruction
- Keep the title unchanged
- Maintain 3-6 bullet points
- Return ONLY valid JSON, no explanation

Return the refined slide as JSON:
{{
  "title": "{title}",
  "bullets": ["refined bullet 1", "refined bullet 2", ...]
}}

Return ONLY the JSON object:
"""

    # ----------------------------------------------------------------------

    @staticmethod
    def _parse_word_refinement(llm_output: str, original_heading: Dict) -> List[Dict]:
        """Parses the LLM output for Word section refinement."""
        try:
            cleaned = RefinementService._extract_json_array(llm_output)
            blocks = json.loads(cleaned)
            
            if not isinstance(blocks, list):
                raise ValueError("Expected JSON array")
            
            # Ensure heading is preserved
            if original_heading and blocks and blocks[0].get("type") != "heading":
                blocks.insert(0, original_heading)
            elif blocks and blocks[0].get("type") == "heading":
                # Update heading level if needed
                blocks[0]["level"] = original_heading.get("level", 2) if original_heading else 2
            
            return blocks
        except Exception as e:
            raise ValueError(f"Failed to parse refinement output: {str(e)}")

    @staticmethod
    def _parse_ppt_refinement(llm_output: str, original_title: str) -> Dict:
        """Parses the LLM output for PPT slide refinement."""
        try:
            cleaned = RefinementService._extract_json_object(llm_output)
            slide = json.loads(cleaned)
            
            if not isinstance(slide, dict):
                raise ValueError("Expected JSON object")
            
            # Ensure title is preserved
            if "title" not in slide:
                slide["title"] = original_title
            
            # Ensure bullets exist
            if "bullets" not in slide or not isinstance(slide["bullets"], list):
                raise ValueError("Missing or invalid bullets array")
            
            return slide
        except Exception as e:
            raise ValueError(f"Failed to parse refinement output: {str(e)}")

    @staticmethod
    def _extract_json_array(text: str) -> str:
        """Extracts a JSON array from text."""
        start = text.find('[')
        end = text.rfind(']') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON array found")
        
        return text[start:end]

    @staticmethod
    def _extract_json_object(text: str) -> str:
        """Extracts a JSON object from text."""
        start = text.find('{')
        end = text.rfind('}') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON object found")
        
        return text[start:end]


# Single shared instance
refinement_service = RefinementService()