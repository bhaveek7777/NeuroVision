import cv2
import numpy as np
from insightface.app import FaceAnalysis
from supabase_client import supabase


# ============================================================
# LOAD INSIGHTFACE MODEL
# Same method as the old CMD embedding code
# ============================================================

print("Loading registration model...")

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

print("Registration model loaded.")


# ============================================================
# REGISTER STUDENT
# Website sends:
#   student_id
#   image_paths
#
# Embeddings are saved to:
#   students.face_embedding
# ============================================================

def register_student(student_id, image_paths):

    print("\n========================================")
    print("Registering face for student:", student_id)
    print("Total images received:", len(image_paths))
    print("========================================")

    # --------------------------------------------------------
    # GET STUDENT FROM SUPABASE
    # --------------------------------------------------------

    response = (
        supabase
        .table("students")
        .select("id, name, roll_number, student_id_code")
        .eq("id", student_id)
        .single()
        .execute()
    )

    if not response.data:
        return {
            "success": False,
            "message": "Student not found."
        }

    student = response.data

    print(
        "Student:",
        student.get("name"),
        "| Roll:",
        student.get("roll_number")
    )


    # --------------------------------------------------------
    # CREATE EMBEDDINGS
    # SAME CORE LOGIC AS OLD CMD CODE
    # --------------------------------------------------------

    embeddings = []

    successful_images = 0
    failed_images = 0


    for index, image_path in enumerate(image_paths):

        filename = image_path.split("\\")[-1]
        filename = filename.split("/")[-1]

        print("\n----------------------------------------")
        print(
            f"Processing image {index + 1}/{len(image_paths)}:"
        )
        print("File:", filename)
        print("----------------------------------------")


        # ----------------------------------------------------
        # LOAD IMAGE
        # EXACTLY LIKE OLD CMD CODE
        # ----------------------------------------------------

        image = cv2.imread(image_path)

        if image is None:

            print("Could not read image:", filename)

            failed_images += 1

            continue


        # ----------------------------------------------------
        # FACE DETECTION
        # EXACTLY LIKE OLD CMD CODE
        # ----------------------------------------------------

        faces = app.get(image)


        if len(faces) == 0:

            print("No face found:", filename)

            failed_images += 1

            continue


        # ----------------------------------------------------
        # USE FIRST DETECTED FACE
        # EXACTLY LIKE OLD CMD CODE
        # ----------------------------------------------------

        embedding = faces[0].embedding


        # ----------------------------------------------------
        # NORMALIZE EMBEDDING
        # EXACTLY LIKE OLD CMD CODE
        # ----------------------------------------------------

        embedding = embedding / np.linalg.norm(embedding)


        # ----------------------------------------------------
        # STORE EMBEDDING
        # Convert NumPy array to normal Python list
        # for Supabase JSON storage.
        # ----------------------------------------------------

        embeddings.append(embedding.tolist())

        successful_images += 1


        print("Processed:", filename)


    # ========================================================
    # NO EMBEDDINGS CREATED
    # ========================================================

    if len(embeddings) == 0:

        return {
            "success": False,
            "message": (
                "No usable face was detected in any "
                "of the uploaded images."
            ),
            "images_received": len(image_paths),
            "images_processed": 0,
            "images_failed": failed_images,
            "embeddings_created": 0
        }


    # ========================================================
    # SAVE ALL EMBEDDINGS TO SUPABASE
    # ========================================================

    print("\nSaving embeddings to Supabase...")

    update_response = (
        supabase
        .table("students")
        .update({
            "face_embedding": embeddings
        })
        .eq("id", student_id)
        .execute()
    )


    if not update_response.data:

        return {
            "success": False,
            "message": "Could not save face embeddings."
        }


    print("Embeddings saved successfully.")
    print("Total embeddings saved:", len(embeddings))


    # ========================================================
    # RELOAD RECOGNITION ENGINE
    # ========================================================

    try:

        from recognition import reload_embeddings

        reload_embeddings()

        print("Recognition embeddings reloaded.")

    except Exception as e:

        print("Embedding reload skipped:", e)


    # ========================================================
    # FINAL RESULT
    # ========================================================

    print("\n========================================")
    print("FACE REGISTRATION COMPLETED")
    print("========================================")

    print(
        "Images received:",
        len(image_paths)
    )

    print(
        "Images processed:",
        successful_images
    )

    print(
        "Images failed:",
        failed_images
    )

    print(
        "Embeddings created:",
        len(embeddings)
    )

    print("========================================")


    return {
        "success": True,
        "student_id": student["id"],
        "name": student["name"],
        "roll_no": student["roll_number"],
        "images_received": len(image_paths),
        "images_processed": successful_images,
        "images_failed": failed_images,
        "embeddings_created": len(embeddings)
    }