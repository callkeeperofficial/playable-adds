from pathlib import Path
import random

out = Path('public/assets')
out.mkdir(parents=True, exist_ok=True)

bg = ['<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024">', '<rect width="100%" height="100%" fill="#10183a"/>']
for _ in range(900):
    x=random.randint(0,2048); y=random.randint(0,1024); w=random.randint(8,30); h=random.randint(8,20)
    c=random.randint(40,110)
    bg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="rgb({c//2},{c//2},{c})" opacity="0.35"/>')
for _ in range(200):
    x=random.randint(0,2048); y=random.randint(300,850); r=random.randint(3,9)
    bg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="orange" opacity="0.7"/>')
bg.append('</svg>')
(out/'bg-forge.svg').write_text('\n'.join(bg))

def chicken(path, body):
    s=f'''<svg xmlns="http://www.w3.org/2000/svg" width="220" height="180">
<ellipse cx="120" cy="110" rx="70" ry="45" fill="{body}"/>
<ellipse cx="75" cy="112" rx="30" ry="30" fill="{body}"/>
<ellipse cx="155" cy="70" rx="30" ry="28" fill="{body}"/>
<polygon points="167,72 205,84 168,95" fill="#f4ab22"/>
<circle cx="150" cy="66" r="5" fill="#111"/>
<polygon points="140,45 156,30 175,45 166,56 148,54" fill="#da3030"/>
</svg>'''
    (out/path).write_text(s)

chicken('chicken-idle.svg','#f5f5dd')
chicken('chicken-jump.svg','#ffe8aa')
chicken('chicken-roasted.svg','#7a4a2a')

(out/'chicken-spritesheet.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="440" height="360"><rect width="100%" height="100%" fill="#0000"/><image href="chicken-idle.svg" width="220" height="180"/><image href="chicken-jump.svg" x="220" width="220" height="180"/><image href="chicken-idle.svg" y="180" width="220" height="180"/><image href="chicken-roasted.svg" x="220" y="180" width="220" height="180"/></svg>')

(out/'ui-reference-1.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="#231326"/><text x="40" y="60" fill="#ffc878" font-size="38">Final forge scene reference #1</text></svg>')
