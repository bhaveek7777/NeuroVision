import cv2
import pickle
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1, det_size=(1280, 1280))

with open("embeddings/students.pkl", "rb") as file:
    students = pickle.load(file)

group_image = cv2.imread("test_images/gp.jpg")

if group_image is None:
    print("ERROR: group.jpg could not be opened.")
    exit()

scale = 2

large_image = cv2.resize(
    group_image,
    None,
    fx=scale,
    fy=scale,
    interpolation=cv2.INTER_CUBIC
)

faces = app.get(large_image)

print("Students loaded:", len(students))
print("Faces detected:", len(faces))

threshold = 0.45

recognized_students = set()

for i, face in enumerate(faces):

    test_embedding = face.embedding
    test_embedding = test_embedding / np.linalg.norm(test_embedding)

    best_student = "Unknown"
    best_similarity = -1

    for student_name, reference_embeddings in students.items():

        for reference in reference_embeddings:

            similarity = np.dot(reference, test_embedding)

            if similarity > best_similarity:
                best_similarity = similarity
                best_student = student_name

    if best_similarity < threshold:
        best_student = "Unknown"
    else:
        recognized_students.add(best_student)

    x1, y1, x2, y2 = face.bbox.astype(int)

    x1 = int(x1 / scale)
    y1 = int(y1 / scale)
    x2 = int(x2 / scale)
    y2 = int(y2 / scale)

    print(
        "Face", i + 1,
        "→", best_student,
        "Similarity:", round(float(best_similarity), 3)
    )

    cv2.rectangle(
        group_image,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        2
    )

    label = str(i + 1)

    if y1 >= 25:
        text_position = (x1, y1 - 10)
    else:
        text_position = (x1, y2 + 25)

    cv2.putText(
        group_image,
        label,
        text_position,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

cv2.imwrite(
    "test_images/group_recognition_result.jpg",
    group_image
)

print("\n========== ATTENDANCE RESULT ==========")

for student in students:
    if student in recognized_students:
        print(student, "→ PRESENT")
    else:
        print(student, "→ ABSENT")

print("\nResult saved as:")
print("test_images/group_recognition_result.jpg")