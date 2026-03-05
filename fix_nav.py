import re

with open('www/js/generate.js', 'r', encoding='utf-8') as f:
    js = f.read()

# I need to check where tab navigation logic is implemented.
# It might be in document.ready in generate.js
