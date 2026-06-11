import logging
import sys
from vectordb import Memory
from models import SearchResult
from .parsers import parse_file, get_excerpt
import os
from tqdm import tqdm

data_dir = "./data"
memory_cache = "./data/memory_index.cache"
logger = logging.getLogger()
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

def load_corpus() -> Memory:
    logger.info(f"Loading corpus from {data_dir}")
    memory = Memory(chunking_strategy={'mode':'paragraph'}, memory_file=memory_cache)

    # load from cache if exists
    if os.path.exists(memory_cache) and not memory.is_empty():
        logger.info(f"Loading memory from cache: {memory_cache}")
        return memory
    else:
        # load text into Memory
        files = os.listdir(data_dir)
        for i in tqdm(range(len(files))):
            filename = files[i]
            if filename.endswith('.txt'):
                metadatas, texts = parse_file(os.path.join(data_dir, filename))
                memory.save(texts, 
                            metadata=metadatas, 
                            memory_file=memory_cache)
            i+=1
    return memory


def clean_title(filename: str) -> str:
    # Remove file extension and replace underscores with spaces
    title = os.path.splitext(filename)[0].replace('_', ' ')
    return title

def search(query: str) -> list[SearchResult]:
    memory = load_corpus()
    logger.info(f"Received search query: {query}")
    results = memory.search(query, top_n=50)

    search_results = []
    for result in results:
        metadata = result['metadata']
        filename = metadata.get('filename', 'Unknown')
        filename = os.path.join(data_dir, filename)
        title = clean_title(metadata.get('filename', 'Unknown'))
        excerpt1, excerpt2 = get_excerpt(
            metadata.get('line'), 
            filename)
        search_results.append(SearchResult(
            title=title,
            excerpt=excerpt1,
            excerpt_subtitle=excerpt2,
            location=metadata.get('filename', 'Unknown'),
            type=metadata.get('genre', 'Unknown'),
            line=metadata.get('line'),
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