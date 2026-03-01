import chromadb
chroma = chromadb.PersistentClient(path="./data/chroma")
for coll in chroma.list_collections():
    print("Collection:", coll.name, "Count:", coll.count())
