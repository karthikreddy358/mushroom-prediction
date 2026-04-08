from extensions import supabase

# Save user
def create_user(name, email, password):
    return supabase.table("users").insert({
        "full_name": name,
        "email": email,
        "password": password
    }).execute()

# Get user
def get_user(email):
    return supabase.table("users").select("*").eq("email", email).execute()

# Save prediction
def save_prediction(image_url, stage, confidence):
    return supabase.table("predictions").insert({
        "image_url": image_url,
        "stage": stage,
        "confidence": confidence
    }).execute()