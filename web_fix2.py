import re
with open('www/index.html', 'r') as f:
    html = f.read()

# Replace the old header with the new combined image
# We need to find:
# <div class="header-inner">
#             <div class="brand-icon"><img src="assets/logo/easybox-logo.png" alt="EasyBox Logo" style="height: 32px; width: auto; max-width: 24px; object-fit: contain; filter: brightness(0) invert(1);"></div>
#             <div>
#                 <h1 class="brand-name" style="margin: 0; padding: 0; display: flex; align-items: center;"><img src="assets/logo/easybox-text.png" alt="EasyBox" style="height: 22px; width: auto; object-fit: contain; "></h1>
#                 <p class="brand-tagline">Network Management Tool</p>
#             </div>

search = r'<div class="brand-icon">.*?</div>\s*<div>\s*<h1 class="brand-name".*?</h1>\s*<p class="brand-tagline">.*?</p>\s*</div>'
replace = r'''<div class="brand-logo" style="display:flex;align-items:center;height:42px;">
                <img src="assets/logo/easybox-full-header.png" alt="EasyBox" style="height: 100%; width: auto; object-fit: contain;">
            </div>'''

html = re.sub(search, replace, html, flags=re.DOTALL)

with open('www/index.html', 'w') as f:
    f.write(html)
