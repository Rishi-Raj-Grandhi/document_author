from app.config.supabase_client import supabase

class ProjectService:

    @staticmethod
    def create_project(user_id: str, title: str, doctype: int):
        """Create a new project entry in Supabase."""
        response = supabase.table("projects").insert({
            "user_id": user_id,
            "title": title,
            "doctype": doctype
        }).execute()

        return response.data[0]

    @staticmethod
    def create_version(project_id: str, config: dict):
        """Insert new version with JSON config. Version number is auto-handled by trigger."""
        response = supabase.table("project_versions").insert({
            "project_id": project_id,
            "config": config,
            "is_current": True
        }).execute()

        return response.data[0]
