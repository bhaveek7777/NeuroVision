import cv2
import os
import numpy as np
from insightface.app import FaceAnalysis

# Load InsightFace model
app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

# Student folder
student_name = "Shreyas_Jain_30"
student_folder = os.path.join("dataset", student_name)

# Store embeddings
student_embeddings = []

# Read student's photos
for filename in os.listdir(student_folder):

    image_path = os.path.join(student_folder, filename)

    image = cv2.imread(image_path)

    if image is None:
        continue

    faces = app.get(image)

    if len(faces) > 0:
        embedding = faces[0].embedding
        student_embeddings.append(embedding)

print("Student:", student_name)
print("Reference photos processed:", len(student_embeddings))

# Calculate average embedding
student_embedding = np.mean(student_embeddings, axis=0)

# Normalize embedding
student_embedding = student_embedding / np.linalg.norm(student_embedding)

# Read group photo
group_image = cv2.imread("test_images/group.jpg")

faces = app.get(group_image)

print("Total faces detected:", len(faces))

# Recognition threshold
threshold = 0.45

recognized_count = 0
unknown_count = 0

# Check every face
for i, face in enumerate(faces):

    face_embedding = face.embedding
    face_embedding = face_embedding / np.linalg.norm(face_embedding)

    # Cosine similarity
    similarity = np.dot(student_embedding, face_embedding)

    x1, y1, x2, y2 = face.bbox.astype(int)

    if similarity >= threshold:

        name = student_name
        recognized_count += 1

    else:

        name = "Unknown"
        unknown_count += 1

    print(
        "Face", i + 1,
        "→", name,
        "Similarity:", round(float(similarity), 3)
    )

    cv2.rectangle(
        group_image,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        2
    )

    cv2.putText(
        group_image,
        name,
        (x1, y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 255, 0),
        2
    )

# Save result
cv2.imwrite("test_images/recognition_result.jpg", group_image)

print("\n----- Attendance Result -----")
print("Total faces:", len(faces))
print("Recognized:", recognized_count)
print("Unknown:", unknown_count)
print("Result saved as recognition_result.jpg")