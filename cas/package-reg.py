from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import stat
root = Path(__file__).resolve().parent
files = {'index.html': root/'public/index.html', 'service-worker.js': root/'public/service-worker.js', 'modules/ui/styles/ecosystem-v321.css': root/'runtime/ecosystem-ui.css', 'modules/ui/runtime/ecosystem-v321.js': root/'runtime/ecosystem-ui.js'}
(root/'deploy').mkdir(exist_ok=True)
with ZipFile(root/'deploy/cas-ecosystem.zip','w',compression=ZIP_DEFLATED) as out:
    dirs = {'modules/', 'modules/ui/', 'modules/ui/styles/', 'modules/ui/runtime/'}
    for name in sorted(dirs) + sorted(files):
        isdir = name.endswith('/')
        info = ZipInfo(name,(2026,10,21,13,0,0))
        info.create_system = 3
        info.compress_type = ZIP_DEFLATED
        info.external_attr = ((stat.S_IFDIR|0o755) if isdir else (stat.S_IFREG|0o644)) << 16
        if isdir: info.external_attr |= 0x10
        out.writestr(info,b'' if isdir else files[name].read_bytes())
print('Prepared CAS enhancement: four public files')
