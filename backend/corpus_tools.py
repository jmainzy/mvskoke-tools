import logging
import sys
from vectordb import Memory
from models import SearchResult

import os

data_dir = "./data"
memory_cache = "./data/memory_index.cache"
logger = logging.getLogger()
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

def load_corpus() -> Memory:
    logger.info(f"Loading corpus from {data_dir}")
    memory = Memory(chunking_strategy={'mode':'sliding_window', 'window_size':20, 'overlapp':8}, memory_file=memory_cache)

    # load from cache if exists
    if os.path.exists(memory_cache) and not memory.is_empty():
        logger.info(f"Loading memory from cache: {memory_cache}")
        return memory
    else:
        # load text into Memory
        for filename in os.listdir(data_dir):
            if filename.endswith('.txt'):
                with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
                    text = f.read()
                    memory.save(text, metadata=[{"filename": filename}], memory_file=memory_cache)
    return memory

def search(query: str) -> list[SearchResult]:
    memory = load_corpus()
    logger.info(f"Received search query: {query}")
    results = memory.search(query)

    search_results = []
    for result in results:
        metadata = result['metadata']
        search_results.append(SearchResult(
            title=metadata.get('filename', 'Unknown'),
            excerpt=result['chunk'],
            location=metadata.get('filename', 'Unknown'),
            distance=result['distance']
        ))

    del memory  # free up memory
    return search_results

if __name__ == "__main__":
    test_query = "mēkusvpkv"
    results = search(test_query)
    for result in results:
        print(f"Title: {result.title}")
        print(f"Excerpt: {result.excerpt}")
        print(f"Location: {result.location}")
        print(f"Distance: {result.distance}")
        print("-" * 40)