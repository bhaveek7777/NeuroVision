from supabase_client import supabase

student = {
    "name": "Test Student",
    "roll_no": "TEST001"
}

response = supabase.table("students").insert(student).execute()

print("Student inserted successfully!")
print(response.data)