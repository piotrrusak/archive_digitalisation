INDENT_SIZE = 2


def get_frontline(debug_indent):
    return "-" * (debug_indent * INDENT_SIZE - 1) + "> " if debug_indent > 0 else ""
