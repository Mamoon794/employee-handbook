import time
from collections import defaultdict
from sklearn.cluster import KMeans
import numpy as np
from setupProvinces import index, vector_store_dimension


def find_popular_questions_from_vector_db():
    seven_days_ago = time.time() - 7 * 24 * 60 * 60
    # Only fetch questions created in the last 7 days
    filter = {
        "created_at": {"$gte": seven_days_ago}
    }

    # Pull all matching vectors (set a high enough limit)
    results = index.query(
        vector=[0.0]*vector_store_dimension,
        top_k=10000, # this is the limit
        include_values=True,   # this includes embeddings
        include_metadata=True,
        namespace="UserQuestions",
        filter=filter
    )

    # print(f"The questions in the last 7 days: {results}")
    # each match in results has id, metadata, score and values (embedding)
    # metadata contains company, created_at, namespace, province, text

    # Group by (province, company)
    groups = defaultdict(list)

    # A dict whose keys are tuples of (province, company) and values are lists of documents
    for match in results["matches"]:
        embedding = match["values"]
        metadata = match["metadata"]
        province = metadata["province"]
        company = metadata["company"]
        key = (province, company)
        text = metadata["text"]
        question = {}
        question["text"] = text
        question["embedding"] = embedding
        groups[key].append(question)

    # Extract embeddings and compute centroids
    centroids_by_group = {}
    for key, questions in groups.items():
        embeddings = [q["embedding"] for q in questions]
        if len(questions) <= 3:
            # if there are fewer than 3 questions, use the embeddings directly
            centroids_by_group[key] = embeddings
            continue
        kmeans = KMeans(n_clusters=3, random_state=42).fit(embeddings)
        centroids_by_group[key] = kmeans.cluster_centers_

    # Now, for each group, find the closest question to each centroid
    popular_questions = []
    for key, centroids in centroids_by_group.items():
        province, company = key
        for centroid in centroids:
            # Find the closest question to this centroid
            # Since we already have groups in memory, min is more efficient than similarity search
            closest_question = min(
                groups[key],
                key=lambda question: np.linalg.norm(np.array(question["embedding"]) - np.array(centroid))
            )
            popular_questions.append({
                "province": province,
                "company": company,
                "text": closest_question["text"],
            })
    return popular_questions
