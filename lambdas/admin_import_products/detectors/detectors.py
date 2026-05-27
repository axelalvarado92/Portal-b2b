from parsers.stasio_parser import StasioParser
from parsers.category_inline_parser import CategoryInlineParser
from parsers.simple_parser import SimpleParser


def detect_parser(filepath, filename):

    filename = filename.lower()

    if "stasio" in filename:
        return StasioParser()

    if "mundial" in filename:
        return CategoryInlineParser()

    return SimpleParser()