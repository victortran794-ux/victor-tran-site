#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/'abilityexperience.html'
CSS=ROOT/'css/style.css'

class Audit(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags=[]; self.images=[]; self.ids=[]; self.classes=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs); self.tags.append((tag,a))
        if tag=='img': self.images.append(a)
        if a.get('id'): self.ids.append(a['id'])
        self.classes.extend((a.get('class') or '').split())

def main():
    html=HTML.read_text(encoding='utf-8'); css=CSS.read_text(encoding='utf-8'); audit=Audit(); audit.feed(html)
    failures=[]
    def need(ok,msg):
        if not ok: failures.append(msg)

    need('<main class="page-content" id="main-content">' in html,'main target must remain identifiable and skip-link ready')
    need('class="ability-hero"' in html,'missing Ability Experience theatrical hero')
    need('class="ability-meta"' in html,'missing full-width project metadata strip')
    need(audit.classes.count('ability-chapter')==3,'expected exactly three numbered chapters')
    for token in ['01 / Anniversary moment','02 / Identity system','03 / Cycling kits']:
        need(token in html,f'missing chapter label: {token}')
    for token in ['data-component="artifact-card"','data-component="technical-diagram"']:
        need(token in html,f'missing approved production component: {token}')
    for class_name in ['ability-kit-grid','ability-map-frame']:
        need(class_name in audit.classes,f'missing approved production component class: {class_name}')
    need('role="img"' in html and 'aria-label="Anniversary moment connects to identity mark, iconography, illustrated print, and cycling kits"' in html,'technical diagram needs a concise text equivalent')
    need('A full brand package built around a single anniversary moment.' in html,'public thesis must remain')
    need('nearly 100 student riders' in html,'existing public rider wording must remain')
    legacy_print_copy="The illustrated print shows the origins of the philanthropy and tells the story of multiple volunteer projects from across the country. Also using the iconography, the cycling kits are used by nearly 100 student cyclists as they rode from the West Coast to Washington D.C."
    need(legacy_print_copy in html,'existing public print-and-rider narrative must remain verbatim')
    need('Brand Designer' in html and 'Identity &amp; Collateral' in html,'public metadata must remain')

    required_images=['thumb-abex.webp','abex-print.jpg','abex-40logo.jpg','abex-icons-1.jpg','abex-icons-2.jpg','abex-kits-1.jpg','abex-kits-2.jpg','abex-kits-3.jpg','abex-map.jpg']
    sources=[Path(i.get('src','')).name for i in audit.images]
    for name in required_images: need(name in sources,f'missing approved public image: {name}')
    for image in audit.images:
        src=image.get('src','')
        if src.startswith('images/abex-') or src.endswith('thumb-abex.webp'):
            need(bool(image.get('alt','').strip()),f'missing alt text: {src}')
            need(image.get('width','').isdigit() and image.get('height','').isdigit(),f'missing dimensions: {src}')

    need('/* ABILITY EXPERIENCE: START */' in css and '/* ABILITY EXPERIENCE: END */' in css,'missing bounded Ability Experience CSS markers')
    slice_start=css.find('/* ABILITY EXPERIENCE: START */'); slice_end=css.find('/* ABILITY EXPERIENCE: END */')
    ability_css=css[slice_start:slice_end] if slice_start!=-1 and slice_end!=-1 else ''
    need('@media (max-width: 700px)' in ability_css,'missing page-specific narrow recomposition')
    need('.ability-diagram' in css and '.ability-artifact' in css,'missing production component styles')
    need('left: 7px;' in ability_css and 'right: 20%;' in ability_css,'desktop diagram line must connect the node sequence')
    need('bottom: 100px;' in ability_css,'mobile diagram line must terminate at the final node')
    need('box-shadow' not in ability_css,'Ability Experience slice must stay shadow-free')
    need('linear-gradient' not in ability_css,'Ability Experience slice must not add gradients')

    need('document-processing' not in html.lower().replace('document-processing.html',''),'Ability content must not reference protected project outside shared navigation')
    need('wxO Canvas' not in html,'Ability content must not reference wxO Canvas')
    need('Victor-on-Carbon' not in html and 'disposable excerpt' not in html,'private prototype language must not ship')
    need('<script src="js/main.js"></script>' in html,'shared site behavior must remain')
    need('project-nav' in audit.classes and 'footer' in audit.classes and 'lens-switcher' in audit.classes,'shared navigation/footer/lens patterns must remain')
    need('style=' not in html,'new production markup must not use inline styles')

    if failures:
        print('ABILITY PRODUCTION CONTRACT: FAIL')
        for item in failures: print(f'- {item}')
        return 1
    print('ABILITY PRODUCTION CONTRACT: PASS')
    print('- approved narrative, media, and three-chapter structure present')
    print('- bounded page-specific CSS and shared site systems preserved')
    print('- accessibility, no-shadow, no-gradient, and protection boundaries present')
    return 0

if __name__=='__main__': sys.exit(main())
