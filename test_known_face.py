import cv2
import os
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

student_name = "Shreyas_Jain_30"
student_folder = os.path.join("dataset", student_name)

embeddings = []

for filename in os.listdir(student_folder):
    image_path = os.path.join(student_folder, filename)
    image = cv2.imread(image_path)

    if image is None:
        continue

    faces = app.get(image)

    if len(faces) > 0:
        embedding = faces[0].embedding
        embedding = embedding / np.linalg.norm(embedding)
        embeddings.append(embedding)

print("Reference photos processed:", len(embeddings))

test_image = cv2.imread("test_images/known.jpg")
faces = app.get(test_image)

print("Faces in test photo:", len(faces))

for i, face in enumerate(faces):

    test_embedding = face.embedding
    test_embedding = test_embedding / np.linalg.norm(test_embedding)

    best_similarity = -1

    for embedding in embeddings:
        similarity = np.dot(embedding, test_embedding)

        if similarity > best_similarity:
            best_similarity = similarity

    if best_similarity >= 0.45:
        result = student_name
    else:
        result = "Unknown"

    print(
        "Face", i + 1,
        "→", result,
        "Similarity:", round(float(best_similarity), 3)
    )