from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import stat
root = Path(__file__).resolve().parent
files = {'index.html': root/'public/index.html', 'service-worker.js': root/'public/service-worker.js', 'modules/ui/styles/ecosystem-v322.css': root/'runtime/ecosystem-ui.css', 'modules/ui/runtime/ecosystem-v321.js': root/'runtime/ecosystem-ui.js'}
files['modules/ui/styles/gameplay-v322.css'] = root/'runtime/gameplay-ui.css'
files['modules/ui/runtime/gameplay-v322.js'] = root/'runtime/gameplay-ui.js'
files['modules/ui/runtime/account-v322.js'] = root/'runtime/account-ui.js'
files['assets/art/roulette-studio-v322.webp'] = root/'public/assets/art/roulette-studio-v322.webp'
for name in ('assets/js-v322/cas-bootstrap.js', 'assets/js-v322/casino.js', 'modules/profile/runtime/progression-v322.js', 'modules/ui/runtime/experience-v322.js', 'modules/ui/runtime/pwa-v322.js'):
    files[name] = root/'public'/name
(root/'deploy').mkdir(exist_ok=True)
with ZipFile(root/'deploy/cas-ecosystem.zip','w',compression=ZIP_DEFLATED) as out:
    dirs = {str(parent).replace('\\','/')+'/' for name in files for parent in Path(name).parents if str(parent) != '.'}
    for name in sorted(dirs) + sorted(files):
        isdir = name.endswith('/')
        info = ZipInfo(name,(2026,10,21,13,0,0))
        info.create_system = 3
        info.compress_type = ZIP_DEFLATED
        info.external_attr = ((stat.S_IFDIR|0o755) if isdir else (stat.S_IFREG|0o644)) << 16
        if isdir: info.external_attr |= 0x10
        out.writestr(info,b'' if isdir else files[name].read_bytes())
print(f'Prepared CAS reliability release: {len(files)} public files')
