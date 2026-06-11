"""
This module provides the Memory class that represents a memory storage system
for text and associated metadata, with functionality for saving, searching, and
managing memory entries.
"""
# pylint: disable = line-too-long, trailing-whitespace, trailing-newlines, line-too-long, missing-module-docstring, import-error, too-few-public-methods, too-many-instance-attributes, too-many-locals

from typing import List, Dict, Any, Union
import itertools

from .chunking import Chunker
from .embedding import BaseEmbedder, Embedder
from .vector_search import VectorSearch
from .storage import Storage


class Memory:
    """
    Memory class represents a memory storage system for text and associated metadata.
    It provides functionality for saving, searching, and managing memory entries.
    """

    def __init__(
        self,
        memory_file: str = '',
        chunking_strategy: dict = {},
        embeddings: Union[BaseEmbedder, str] = "normal",
    ):
        """
        Initializes the Memory class.

        :param memory_file: a string containing the path to the memory file. (default: None)
        :param chunking_strategy: a dictionary containing the chunking mode (default: {"mode": "sliding_window"}).
        :param embedding_model: a string containing the name of the pre-trained model to be used for embeddings (default: "sentence-transformers/all-MiniLM-L6-v2").
        """
        self.memory_file = memory_file

        if memory_file is None:
            self.memory = []
            self.metadata_memory = []
        else:
            load = Storage(memory_file).load_from_disk()
            self.memory = [] if len(load) != 1 else load[0]["memory"]
            self.metadata_memory = [] if len(load) != 1 else load[0]["metadata"]

        if not chunking_strategy:
            chunking_strategy = {"mode": "sliding_window"}
        self.chunker = Chunker(chunking_strategy)

        self.metadata_index_counter = 0
        self.text_index_counter = 0

        if isinstance(embeddings, str):
            self.embedder = Embedder(embeddings)
        elif isinstance(embeddings, BaseEmbedder):
            self.embedder = embeddings
        else:
            raise TypeError("Embeddings must be an Embedder instance or string")

        self.vector_search = VectorSearch()

    def load_from_file(self, memory_file: str):
        """
        Loads memory from a file.

        :param memory_file: a string containing the path to the memory file.
        """
        load = Storage(memory_file).load_from_disk()
        if len(load) != 1:
            raise ValueError("Invalid memory file format")
        self.memory = load[0]["memory"]
        self.metadata_memory = load[0]["metadata"]

    def save(
        self,
        texts,
        metadata: Union[List, List[dict], None] = None,
        memory_file: str = '',
    ):
        """
        Saves the given texts and metadata to memory.

        :param texts: a string or a list of strings containing the texts to be saved.
        :param metadata: a dictionary or a list of dictionaries containing the metadata associated with the texts.
        :param memory_file: a string containing the path to the memory file. (default: None)
        """

        if not isinstance(texts, list):
            texts = [texts]

        if metadata is None:
            metadata = []
        elif not isinstance(metadata, list):
            metadata = [metadata]

        # Extend metadata to be the same length as texts, if it's shorter.
        metadata += [{}] * (len(texts) - len(metadata))

        for meta in metadata:
            self.metadata_memory.append(meta)

        meta_index_start = (
            self.metadata_index_counter
        )  # Starting index for this save operation
        self.metadata_index_counter += len(
            metadata
        )  # Update the counter for future save operations

        if not memory_file:
            memory_file = self.memory_file

        text_chunks = [self.chunker(text) for text in texts]
        chunks_size = [len(chunks) for chunks in text_chunks]

        flatten_chunks = list(itertools.chain.from_iterable(text_chunks))

        embeddings = self.embedder.embed_text(flatten_chunks)

        # text_index_start = (
        #     self.text_index_counter
        # )  # Starting index for this save operation

        # accumulated size is end_index of each chunk
        for size, end_index, chunks, meta_index, i in zip(
            chunks_size,
            itertools.accumulate(chunks_size),
            text_chunks,
            range(meta_index_start, self.metadata_index_counter),
            range(0, len(text_chunks))
        ):
            start_index = end_index - size
            chunks_embedding = embeddings[start_index:end_index]
            filename = metadata[i]['filename']
            text_index = int.from_bytes(filename.encode(), 'little')

            for chunk, embedding in zip(chunks, chunks_embedding):
                entry = {
                    "chunk": chunk,
                    "embedding": embedding,
                    "metadata_index": meta_index,
                    "text_index": text_index,
                }
                self.memory.append(entry)

        if not memory_file:
            Storage(memory_file).save_to_disk([{"memory": self.memory, "metadata" :self.metadata_memory}])

    def search(
        self, query: str, top_n: int = 5, unique: bool = False, batch_results: str = "flatten"
    ) -> List[Dict[str, Any]]:
        """
        Searches for the most similar chunks to the given query in memory.

        :param query: a string containing the query text.
        :param top_n: the number of most similar chunks to return. (default: 5)
        :param unique: chunks are filtered out to unique texts (default: False)
        :param batch_results: if input is list of queries, results can use "flatten" or "diverse" algorithm
        :return: a list of dictionaries containing the top_n most similar chunks and their associated metadata.
        """

        if isinstance(query, list):
            embedded = self.embedder.embed_text(query)
            if not embedded:
                return []
            query_embedding = embedded[0]
        else:
            query_embedding = self.embedder.embed_text([query])[0]

        embeddings = [entry["embedding"] for entry in self.memory]
        if len(embeddings) == 0:
            return []

        indices = self.vector_search.search_vectors(query_embedding, embeddings, top_n, batch_results)
        if unique:
            unique_indices = []
            seen_text_indices = set()  # Change the variable name
            for i in indices:
                text_index = self.memory[i[0]][
                    "text_index"
                ]  # Use text_index instead of metadata_index
                if (
                    text_index not in seen_text_indices
                ):  # Use seen_text_indices instead of seen_meta_indices
                    unique_indices.append(i)
                    seen_text_indices.add(
                        text_index
                    )  # Use seen_text_indices instead of seen_meta_indices
            indices = unique_indices

        # filter out high distance
        threshold = 0.59
        indices = [i for i in indices if i[1] <= threshold]
        # order by distance (most relevant)

        results = [
            {
                "chunk": self.memory[i[0]]["chunk"],
                "metadata": self.metadata_memory[self.memory[i[0]]["metadata_index"]],
                "distance": i[1],
            }
            for i in indices
        ]

        return results

    def clear(self):
        """
        Clears the memory.
        """
        self.memory = []
        self.metadata_memory = []
        self.metadata_index_counter = 0
        self.text_index_counter = 0

        if self.memory_file:
            Storage(self.memory_file).save_to_disk([{"memory": self.memory, "metadata" :self.metadata_memory}])

    def dump(self):
        """
        Prints the contents of the memory.
        """
        for entry in self.memory:
            print("Chunk:", entry["chunk"])
            print("Embedding Length:", len(entry["embedding"]))
            print("Metadata:", self.metadata_memory[entry["metadata_index"]])
            print("-" * 40)

        print("Total entries: ", len(self.memory))
        print("Total metadata: ", len(self.metadata_memory))

    def is_empty(self):
        """
        Checks if the memory is empty.

        :return: True if the memory is empty, False otherwise.
        """
        return len(self.memory) == 0
