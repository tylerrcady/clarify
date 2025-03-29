import os
import csv
import uuid
import datetime
import openai
import json
from supabase import create_client # type: ignore
from bs4 import BeautifulSoup
from typing import List
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.environ.get("OPENAI_API_KEY")
COURSE_ID = os.environ.get("COURSE_ID")
CREATOR_ID = os.environ.get("CREATOR_ID")

def generate_embedding(text: str) -> List[float]:
    """Generate embedding for text using OpenAI's API."""
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

supabase = create_client(os.environ.get("NEXT_PUBLIC_SUPABASE_URL"), os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))

def read_csv(file_path):
    """Read a CSV file and return a list of dictionaries."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))

posts = read_csv('data/ai/Posts.csv')
tags = read_csv('data/ai/Tags.csv')

tag_post_map = {}
for post in posts:
    if post['Tags'].count('<') == 1: 
        tag = post['Tags'].strip('<>')
        if tag not in tag_post_map:
            tag_post_map[tag] = []
        if len(tag_post_map[tag]) < 1: # one each right now for testing
            tag_post_map[tag].append(post)

threads = []
for i, (tag, post_list) in enumerate(tag_post_map.items()):
    for post in post_list:
        thread = {
            "id": str(uuid.uuid4()),
            "course_id": COURSE_ID,
            "title": post.get("Title", "No Title"),
            "content": BeautifulSoup(post.get("Body", "No Content"), features="html.parser").get_text(), # see: https://stackoverflow.com/questions/14694482/converting-html-to-text-with-python
            "tags": [tag],
            "creator_id": CREATOR_ID,
            "creator_role": "Student",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "embedding": generate_embedding(f"{post.get('Title', '')}\n{BeautifulSoup(post.get('Body', ''), features="html.parser").get_text()}")
        }
        threads.append(thread)
    if i == 0: break # for testing

response = supabase.table("threads").insert(threads).execute()
print(response)