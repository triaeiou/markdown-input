import os
from aqt import colors
from .constants import ADDON_PATH

###########################################################################
def get_path(file_name: str):
    """Get path to user defined file or default, note: does not include addon directory."""
    if os.path.exists(os.path.join(ADDON_PATH, f'user_files/{file_name}')):
        return f'user_files/{file_name}'
    return file_name

###########################################################################
def get_colors(dark):
    """Get CSS string with Anki colors"""
    css = ":root {\n"
    for key, val in colors.__dict__.items():
        if type(val) is dict and (val_ := val.get('dark') if dark else val.get('light')):
            css += f'''   --{key.lower().replace('_', '-')}: {val_};\n'''
    css += '}'
    return css

###########################################################################
def tracefunc(frame, event, arg, indent=[0]):
    """Print function entry and exit (own code) use with the following in __init__.py:

    from .utils import tracefunc
    import sys
    sys.setprofile(tracefunc)
    """
    # Check that it is our file
    if os.path.dirname(__file__) == os.path.dirname(frame.f_code.co_filename):
        if event == "call" or event == "return":
            funcname = frame.f_code.co_name
            filename = os.path.basename(frame.f_code.co_filename)
        if event == "call":
            indent[0] += 2
            print("-" * indent[0] + "> enter ", funcname, " (", filename, ")")
        elif event == "return":
            print("<" + "-" * indent[0], "exit ", funcname, " (", filename, ")")
            indent[0] -= 2
        return tracefunc
