import os

def remove_tag(line) -> str:
    # strip out the sfm tag
    line = line.split('\t')
    if len(line) > 1:
        return line[1].strip()
    else:
        return ""

def get_excerpt(line_number, filename) -> tuple[str, str]:
    # get preview of the line including the related line (en gloss or mvskoke)
    excerpt1 = ""
    excerpt2 = ""
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        excerpt1 = lines[line_number].replace('§','')
        next_line = lines[line_number+1]
        if next_line and remove_tag(next_line) and not '\\gls' in next_line:
            excerpt2 = next_line
        else:
            excerpt2 = lines[line_number-1].strip().replace('§','')
    return remove_tag(excerpt1), remove_tag(excerpt2)

def extract_fields(text, metadata):
    # Splits file content into lines, with each line
    # having its own metadata including line number and language
    metadatas = []
    lines = []

    i = 0
    for line in text.splitlines():
        line = line.strip()
        if line.startswith(r'\mus'):
            parts = line.split('\t')
            if len(parts) > 1:
                lines.append(line.split('\t')[1].strip())
                line_info = {'language': 'mus', 'line': i}
                metadatas.append(dict(line_info, **metadata))
            else:
                lines.append('') # make sure lines match
                line_info = {'language': 'mus', 'line': i}
                metadatas.append(dict(line_info, **metadata))
        elif line.startswith(r'\en'):
            parts = line.split('\t')
            if len(parts) > 1:
                lines.append(line.split('\t')[1].strip())
                line_info = {'language': 'en', 'line': i}
                metadatas.append(dict(line_info, **metadata))
            else:
                lines.append('')
                line_info = {'language': 'en', 'line': i}
                metadatas.append(dict(line_info, **metadata))
        i += 1

    return metadatas, lines

def parse_file(file_path: str) -> tuple[list[dict], list[str]]:
    # read file with file header and contents with line metadata
    with open(file_path, 'r', encoding='utf-8') as f:
        # read file header
        metadata = {}
        metadata['filename'] = os.path.basename(file_path)
        for line in f:
            if not line.startswith(r'\mus'):
                splits = line.strip().split(':')
                if len(splits) >= 2:
                    label, value = splits[0].strip(), splits[1].strip()
                    metadata[label.strip()] = value.strip()
            else:
                break
        # read all of the file as content
        f.seek(0)
        content = str(metadata)

        metadatas, lines = extract_fields(f.read(), metadata)

        content += '\n\n' + f.read()
    return metadatas, lines