"""
NeuroVision Recognition Engine
Loads face embeddings from Supabase (face_embeddings + students tables).
Falls back to local pkl if Supabase is unavailable.
"""
import os
import cv2
import pickle
import numpy as np
from insightface.app import FaceAnalysis

print("Loading NeuroVision model...")
model = FaceAnalysis(name="buffalo_l")
model.prepare(ctx_id=-1, det_size=(1280, 1280))
print("Model loaded.")

# ── Load embeddings ───────────────────────────────────────────────────────────

def _load_from_supabase():
    """
    Load face embeddings directly from the frontend students table.

    Returns:
        {
            "Student_Name_RollNo": [
                np.ndarray,
                np.ndarray,
                ...
            ]
        }
    """

    try:

        from supabase_client import supabase

        students_rows = (
            supabase
            .table("students")
            .select("id, name, roll_number, face_embedding")
            .eq("is_active", True)
            .execute()
            .data
        )

        if not students_rows:
            return None

        result = {}

        for student in students_rows:

            embeddings = student.get("face_embedding")

            if not embeddings:
                continue

            name = student.get("name", "Unknown")
            roll_no = student.get("roll_number", "0")

            # Example:
            # Dhruv Wankhede + 75
            # becomes:
            # Dhruv_Wankhede_75

            pkl_key = (
                name.replace(" ", "_")
                + "_"
                + str(roll_no)
            )

            # face_embedding contains multiple embeddings
            for embedding in embeddings:

                emb = np.array(
                    embedding,
                    dtype=np.float32
                )

                if emb.size == 0:
                    continue

                # Normalize
                norm = np.linalg.norm(emb)

                if norm == 0:
                    continue

                emb = emb / norm

                result.setdefault(
                    pkl_key,
                    []
                ).append(emb)

        print(
            f"Embeddings loaded from Supabase: "
            f"{len(result)} students"
        )

        return result if result else None

    except Exception as e:

        print(
            f"Supabase embedding load failed: {e}"
        )

        return None


def _load_from_pkl():
    """Fallback: load from local pkl file."""
    paths = [
        os.path.join(os.path.dirname(__file__), "../embeddings/students.pkl"),
        os.path.join("embeddings", "students.pkl"),
        "../embeddings/students.pkl",
    ]
    for p in paths:
        if os.path.exists(p):
            with open(p, "rb") as f:
                data = pickle.load(f)
            print(f"Embeddings loaded from pkl ({p}): {len(data)} students")
            return data
    raise FileNotFoundError("students.pkl not found")


# Try Supabase first, fall back to pkl
students = _load_from_supabase()

if students:
    print("SOURCE: Supabase")
else:
    print("SOURCE: Local students.pkl")
    students = _load_from_pkl()

print(f"Students loaded: {len(students)}")
print(
    "Total individual embeddings:",
    sum(len(embeddings) for embeddings in students.values())
)


def reload_embeddings():
    """Call this after registering a new student to refresh in-memory embeddings."""
    global students
    fresh = _load_from_supabase()
    if fresh is not None:
        students = fresh
        print(f"Embeddings reloaded from Supabase: {len(students)} students")
    else:
        print("Supabase reload failed — keeping current embeddings")


# ── Recognition function ──────────────────────────────────────────────────────

def recognize_faces(image_path: str):
    group_image = cv2.imread(image_path)
    if group_image is None:
        return None

    # Upscale for better detection of distant faces
    large_image = cv2.resize(group_image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    faces = model.get(large_image)
    print(f"Faces detected: {len(faces)}")

    threshold = 0.45
    recognized_students = set()
    face_results = []

    for i, face in enumerate(faces):
        test_embedding = face.embedding / np.linalg.norm(face.embedding)

        best_student   = "Unknown"
        best_similarity = -1.0

        for student_name, reference_embeddings in students.items():
            for ref in reference_embeddings:
                ref_norm   = ref / np.linalg.norm(ref)
                similarity = float(np.dot(ref_norm, test_embedding))
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_student    = student_name

        if best_similarity >= threshold:
            recognized_students.add(best_student)
        else:
            best_student = "Unknown"

        x1, y1, x2, y2 = face.bbox.astype(int)
        print(f"  Face {i+1} → {best_student}  similarity={best_similarity:.3f}")

        face_results.append({
            "face_number": i + 1,
            "name":        best_student,
            "similarity":  round(best_similarity, 3),
            "bbox":        [int(x1), int(y1), int(x2), int(y2)],
        })

    attendance = [
        {"student": name, "status": "Present" if name in recognized_students else "Absent"}
        for name in students
    ]

    return {
        "total_faces":  len(faces),
        "attendance":   attendance,
        "face_results": face_results,
    }
