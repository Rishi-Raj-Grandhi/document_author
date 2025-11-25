from fastapi import APIRouter, Depends, Request, HTTPException
from app.utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Dict
from app.services.docx_service import DocxService
from app.services.ppt_service import PptService
from app.services.outline_service import OutlineService
from app.services.refinement_service import RefinementService
from fastapi.responses import StreamingResponse
from app.services.document_export import export_to_word
from app.services.ppt_export_service import export_to_ppt
from app.services.project_service import ProjectService
import httpx
import os
import json
from dotenv import load_dotenv
from app.config.supabase_client import supabase

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


# === Models ===
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str

class DocumentRequest(BaseModel):
    main_topic: str
    sections: List[str]

class PptRequest(BaseModel):
    topic: str
    slides: List[str]

class SuggestOutlineRequest(BaseModel):
    topic: str
    doc_type: str  # 'word' or 'ppt'

class FeedbackRequest(BaseModel):
    section_title: str
    liked: bool  # true for like, false for dislike

class CommentRequest(BaseModel):
    section_title: str
    comment: str

class RefinementRequest(BaseModel):
    section_title: str
    refinement_prompt: str


# === Login API ===
@router.post("/login")
async def login_user(payload: LoginRequest):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={
            "email": payload.email,
            "password": payload.password
        }, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return resp.json()


# === Signup API ===
@router.post("/signup")
async def signup_user(payload: SignupRequest):
    """
    Creates a new user account using Supabase Auth.
    Note: If email confirmation is enabled in Supabase, access_token may not be returned.
    """
    url = f"{SUPABASE_URL}/auth/v1/signup"
    headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={
            "email": payload.email,
            "password": payload.password
        }, headers=headers)

    if resp.status_code != 200:
        error_data = resp.json() if resp.content else {}
        error_message = error_data.get("msg", error_data.get("message", "Signup failed"))
        raise HTTPException(status_code=resp.status_code, detail=error_message)

    response_data = resp.json()
    
    # Supabase signup response format:
    # - If email confirmation disabled: returns access_token and user
    # - If email confirmation enabled: returns user only (no access_token)
    # We normalize the response to always include user and access_token (if available)
    if "user" not in response_data and "id" in response_data:
        # Sometimes user data is at root level
        response_data["user"] = {
            "id": response_data.get("id"),
            "email": response_data.get("email"),
            "user_metadata": response_data.get("user_metadata", {}),
        }
    
    return response_data


# === Generate Word JSON + Save to DB ===
@router.post("/generate-word-json")
def generate_word_json(payload: DocumentRequest, user=Depends(get_current_user)):
    doc_json = DocxService.create_word_content(
        main_topic=payload.main_topic,
        sections=payload.sections
    )

    project = ProjectService.create_project(
        user_id=user["user_id"],
        title=doc_json["title"],
        doctype=1  # Word
    )

    version = ProjectService.create_version(
        project_id=project["id"],
        config=doc_json
    )

    return {
        "message": "Word project successfully created",
        "project": project,
        "version": version,
        "content": doc_json
    }


# === Generate PPT JSON + Save to DB ===
@router.post("/generate-ppt-json")
def generate_ppt_json(payload: PptRequest, user=Depends(get_current_user)):
    ppt_json = PptService.create_ppt_content(
        topic=payload.topic,
        slides=payload.slides
    )

    project = ProjectService.create_project(
        user_id=user["user_id"],
        title=ppt_json["topic"],
        doctype=0  # PPT
    )

    version = ProjectService.create_version(
        project_id=project["id"],
        config=ppt_json
    )

    return {
        "message": "PPT project successfully created",
        "project": project,
        "version": version,
        "content": ppt_json
    }


# === Suggest Outline ===
@router.post("/suggest-outline")
def suggest_outline(payload: SuggestOutlineRequest, user=Depends(get_current_user)):
    """
    Suggests document outline (sections for Word, slides for PPT) based on topic.
    """
    try:
        if payload.doc_type == 'word':
            sections = OutlineService.suggest_word_sections(payload.topic)
            return {
                "message": "Outline suggested successfully",
                "sections": sections
            }
        elif payload.doc_type == 'ppt':
            slides = OutlineService.suggest_ppt_slides(payload.topic)
            return {
                "message": "Outline suggested successfully",
                "slides": slides
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid doc_type. Must be 'word' or 'ppt'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate outline: {str(e)}")


# === Export Word ===
@router.post("/word")
async def export_word(request: Request, user=Depends(get_current_user)):
    payload: Dict = await request.json()
    document = payload.get("document") or payload
    buffer = export_to_word(document)

    filename = f"{document.get('title', 'Document')}.docx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# === Export PPT ===
@router.post("/ppt")
async def export_ppt(request: Request, user=Depends(get_current_user)):
    payload: Dict = await request.json()
    presentation = payload.get("presentation") or payload
    buffer = export_to_ppt(presentation)

    filename = f"{presentation.get('topic', 'Presentation')}.pptx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
@router.get("/projects/my")
async def get_my_projects(user=Depends(get_current_user)):
    response = supabase.table("projects") \
        .select("*") \
        .eq("user_id", user["user_id"]) \
        .order("created_at", desc=True) \
        .execute()

    return {
        "message": "Projects fetched successfully",
        "projects": response.data
    }
@router.get("/projects/{project_id}/versions")
async def get_project_versions(project_id: str, user=Depends(get_current_user)):
    # Validate that user owns this project
    project_check = supabase.table("projects") \
        .select("user_id") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")

    response = supabase.table("project_versions") \
        .select("*") \
        .eq("project_id", project_id) \
        .order("version_number", desc=True) \
        .execute()

    return {
        "message": "Versions fetched successfully",
        "project_id": project_id,
        "versions": response.data
    }
@router.get("/projects/{project_id}/versions/{version_id}")
async def get_single_version(project_id: str, version_id: str, user=Depends(get_current_user)):
    # Check if user owns the project
    project_check = supabase.table("projects") \
        .select("user_id") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Fetch that specific version
    response = supabase.table("project_versions") \
        .select("*") \
        .eq("id", version_id) \
        .eq("project_id", project_id) \
        .single() \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "message": "Version fetched successfully",
        "version": response.data
    }
@router.get("/projects/{project_id}/versions/{version_id}/download")
async def download_version(project_id: str, version_id: str, user=Depends(get_current_user)):

    # Validate user owns the project
    project_check = supabase.table("projects").select("doctype", "user_id", "title")\
        .eq("id", project_id).single().execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    doctype = project_check.data["doctype"]  # 1 = Word, 0 = PPT

    # Fetch version config
    version_data = supabase.table("project_versions")\
        .select("config")\
        .eq("id", version_id)\
        .eq("project_id", project_id)\
        .single().execute()

    if not version_data.data:
        raise HTTPException(status_code=404, detail="Version not found")

    content = version_data.data["config"]

    # Generate document
    if doctype == 1:   # Word
        buffer = export_to_word(content)
        filename = f"{project_check.data['title']}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:              # PPT
        buffer = export_to_ppt(content)
        filename = f"{project_check.data['title']}.pptx"
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# === Section Feedback ===
@router.post("/projects/{project_id}/versions/{version_id}/feedback")
async def submit_feedback(
    project_id: str, 
    version_id: str, 
    payload: FeedbackRequest,
    user=Depends(get_current_user)
):
    """
    Submit like/dislike feedback for a section.
    Uses upsert to handle the unique constraint (update if exists, insert if not).
    """
    # Validate user owns the project
    project_check = supabase.table("projects") \
        .select("user_id") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Verify version belongs to project
    version_check = supabase.table("project_versions") \
        .select("id") \
        .eq("id", version_id) \
        .eq("project_id", project_id) \
        .single() \
        .execute()

    if not version_check.data:
        raise HTTPException(status_code=404, detail="Version not found")

    # Check if feedback already exists
    existing = supabase.table("section_feedback") \
        .select("*") \
        .eq("version_id", version_id) \
        .eq("user_id", user["user_id"]) \
        .eq("section_title", payload.section_title) \
        .execute()

    # Update if exists, insert if not
    if existing.data and len(existing.data) > 0:
        # Preserve existing comment
        current_comment = existing.data[0].get("comment")
        response = supabase.table("section_feedback") \
            .update({
                "liked": payload.liked,
                "comment": current_comment  # Preserve existing comment
            }) \
            .eq("version_id", version_id) \
            .eq("user_id", user["user_id"]) \
            .eq("section_title", payload.section_title) \
            .execute()
    else:
        feedback_data = {
            "version_id": version_id,
            "user_id": user["user_id"],
            "section_title": payload.section_title,
            "liked": payload.liked,
            "comment": None
        }
        response = supabase.table("section_feedback") \
            .insert(feedback_data) \
            .execute()

    return {
        "message": "Feedback submitted successfully",
        "feedback": response.data[0] if response.data else feedback_data
    }


@router.post("/projects/{project_id}/versions/{version_id}/comments")
async def add_comment(
    project_id: str,
    version_id: str,
    payload: CommentRequest,
    user=Depends(get_current_user)
):
    """
    Add or update a comment for a section.
    Uses upsert to handle the unique constraint.
    """
    # Validate user owns the project
    project_check = supabase.table("projects") \
        .select("user_id") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Verify version belongs to project
    version_check = supabase.table("project_versions") \
        .select("id") \
        .eq("id", version_id) \
        .eq("project_id", project_id) \
        .single() \
        .execute()

    if not version_check.data:
        raise HTTPException(status_code=404, detail="Version not found")

    # Check if feedback already exists
    existing = supabase.table("section_feedback") \
        .select("*") \
        .eq("version_id", version_id) \
        .eq("user_id", user["user_id"]) \
        .eq("section_title", payload.section_title) \
        .execute()

    comment_data = {
        "version_id": version_id,
        "user_id": user["user_id"],
        "section_title": payload.section_title,
        "comment": payload.comment,
        "liked": None  # Don't change like/dislike status when adding comment
    }

    # Update if exists, insert if not
    if existing.data and len(existing.data) > 0:
        # Preserve existing liked status
        current_liked = existing.data[0].get("liked")
        response = supabase.table("section_feedback") \
            .update({
                "comment": payload.comment,
                "liked": current_liked  # Preserve existing like/dislike
            }) \
            .eq("version_id", version_id) \
            .eq("user_id", user["user_id"]) \
            .eq("section_title", payload.section_title) \
            .execute()
    else:
        response = supabase.table("section_feedback") \
            .insert(comment_data) \
            .execute()

    return {
        "message": "Comment added successfully",
        "feedback": response.data[0] if response.data else comment_data
    }


@router.get("/projects/{project_id}/versions/{version_id}/feedback")
async def get_feedback(
    project_id: str,
    version_id: str,
    user=Depends(get_current_user)
):
    """
    Get all feedback for a version (for the current user).
    """
    # Validate user owns the project
    project_check = supabase.table("projects") \
        .select("user_id") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Get all feedback for this version and user
    response = supabase.table("section_feedback") \
        .select("*") \
        .eq("version_id", version_id) \
        .eq("user_id", user["user_id"]) \
        .execute()

    return {
        "message": "Feedback retrieved successfully",
        "feedback": response.data or []
    }


# === AI Refinement ===
@router.post("/projects/{project_id}/versions/{version_id}/refine")
async def refine_section(
    project_id: str,
    version_id: str,
    payload: RefinementRequest,
    user=Depends(get_current_user)
):
    """
    Refines a specific section/slide using AI and creates a new version.
    """
    # Validate user owns the project
    project_check = supabase.table("projects") \
        .select("user_id", "doctype") \
        .eq("id", project_id) \
        .single() \
        .execute()

    if not project_check.data or project_check.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Get current version content
    version_data = supabase.table("project_versions") \
        .select("config") \
        .eq("id", version_id) \
        .eq("project_id", project_id) \
        .single() \
        .execute()

    if not version_data.data:
        raise HTTPException(status_code=404, detail="Version not found")

    content = version_data.data["config"]
    doctype = project_check.data["doctype"]  # 1 = Word, 0 = PPT

    # Parse content if it's a string
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except:
            pass

    # Find and refine the section
    if doctype == 1:
        # Word document - find section by heading text
        blocks = content.get("blocks", [])
        section_start_idx = None
        section_end_idx = None
        section_blocks = []
        
        # Find the section with matching heading
        for i, block in enumerate(blocks):
            if block.get("type") == "heading" and block.get("text") == payload.section_title:
                section_start_idx = i
                # Collect heading and all following paragraphs until next heading
                section_blocks.append(block)
                for j in range(i + 1, len(blocks)):
                    if blocks[j].get("type") == "heading":
                        section_end_idx = j
                        break
                    section_blocks.append(blocks[j])
                else:
                    section_end_idx = len(blocks)
                break
        
        if section_start_idx is None:
            raise HTTPException(status_code=404, detail=f"Section '{payload.section_title}' not found")
        
        # Refine the section
        refined_blocks = RefinementService.refine_word_section(section_blocks, payload.refinement_prompt)
        
        # Replace the section in the content
        new_blocks = (
            blocks[:section_start_idx] + 
            refined_blocks + 
            blocks[section_end_idx:]
        )
        content["blocks"] = new_blocks
        
    else:
        # PPT - find slide by title
        slides = content.get("slides", [])
        slide_index = None
        
        for i, slide in enumerate(slides):
            if slide.get("title") == payload.section_title:
                slide_index = i
                break
        
        if slide_index is None:
            raise HTTPException(status_code=404, detail=f"Slide '{payload.section_title}' not found")
        
        # Refine the slide
        refined_slide = RefinementService.refine_ppt_slide(slides[slide_index], payload.refinement_prompt)
        
        # Replace the slide in the content
        slides[slide_index] = refined_slide
        content["slides"] = slides

    # Create new version with refined content
    new_version = ProjectService.create_version(
        project_id=project_id,
        config=content
    )

    return {
        "message": "Section refined and new version created successfully",
        "version": new_version,
        "content": content
    }