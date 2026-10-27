"""Validate the install overlay without contacting an account or game API."""
from pathlib import Path
from zipfile import ZipFile
import re

root=Path(__file__).resolve().parent
active={
 'modules/ui/styles/panels-v329.css':root/'public/modules/ui/styles/panels-v329.css',
 'modules/ui/styles/connection-v329.css':root/'public/modules/ui/styles/connection-v329.css',
 'modules/ui/styles/game-guide-v329.css':root/'public/modules/ui/styles/game-guide-v329.css',
 'modules/ui/runtime/panels-v329.js':root/'public/modules/ui/runtime/panels-v329.js',
 'modules/ui/runtime/connection-v329.js':root/'public/modules/ui/runtime/connection-v329.js',
 'modules/ui/runtime/game-guide-v329.js':root/'public/modules/ui/runtime/game-guide-v329.js',

 'modules/profile/runtime/history-v328.js':root/'public/modules/profile/runtime/history-v328.js',
 'modules/profile/styles/history-v328.css':root/'public/modules/profile/styles/history-v328.css',
 'modules/profile/runtime/profile-v328.js':root/'public/modules/profile/runtime/profile-v328.js',
 'modules/profile/runtime/admin-v328.js':root/'public/modules/profile/runtime/admin-v328.js',
 'modules/ui/runtime/experience-v328.js':root/'public/modules/ui/runtime/experience-v328.js',
 'modules/ui/runtime/pwa-v328.js':root/'public/modules/ui/runtime/pwa-v328.js',
 'modules/core/runtime/lifecycle-v328.js':root/'public/modules/core/runtime/lifecycle-v328.js',
 'assets/js-v327/identity-account.js':root/'public/assets/js-v327/identity-account.js',
 'modules/poker/runtime/poker-core-v326.js':root/'public/modules/poker/runtime/poker-core-v326.js',
 'assets/js-v326/cas-bootstrap.js':root/'public/assets/js-v326/cas-bootstrap.js',
 'assets/js-v328/casino.js':root/'public/assets/js-v328/casino.js',
 'modules/poker/runtime/poker-pro-v328.js':root/'public/modules/poker/runtime/poker-pro-v328.js',
 'modules/network/runtime/online-v327.js':root/'public/modules/network/runtime/online-v327.js',
 'modules/legacy/runtime/wallet-v327.js':root/'public/modules/legacy/runtime/wallet-v327.js',
 'modules/ui/runtime/roulette-photo-v326.js':root/'runtime/roulette-photo.js',
 'modules/ui/runtime/account-v327.js':root/'runtime/account-ui.js',
 'modules/ui/styles/gameplay-v327.css':root/'runtime/gameplay-ui.css',
}
import json
mg_paths=json.loads((root/'recovery-v332-active-paths.json').read_text(encoding='utf-8'))
for old,new in mg_paths['paths'].items():
    active.pop(old,None)
    active[new]=root/'public'/new
for name in mg_paths['additional']:
    active[name]=root/'public'/name
with ZipFile(root/'deploy/cas-ecosystem.zip') as archive:
    names=[i.filename for i in archive.infolist() if not i.is_dir()]
    assert len(names)==len(set(names))==66, 'Unexpected or duplicate public files'
    assert archive.testzip() is None, 'Corrupt archive entry'
    for name in names:
        assert not name.startswith(('/', '\\')) and '..' not in name.split('/'), name
        assert Path(name).suffix in {'.js','.css','.html','.webp'}, name
        assert not any(part in name.lower() for part in ('private','secret','.env','worker.owner','test/','fixture')),name
    index=archive.read('index.html').decode('utf-8')
    worker=archive.read('service-worker.js').decode('utf-8')
    assert 'recovery-20261027-v332-shell' in worker
    scripts=re.findall(r'<script\b[^>]*src="([^"]+)"',index)
    assert len(scripts)==len(set(scripts)), 'Duplicate script load'
    for name,source in active.items():
        assert archive.read(name)==source.read_bytes(), f'Package/source mismatch: {name}'
        assert name in index and name in worker, f'Inactive or uncached release asset: {name}'
    assert 'modules/legacy/legacy-runtime/04-v69-jarvis-cas-runtime.js' not in index
    assert archive.read('index.html')==(root/'public/index.html').read_bytes()
    assert archive.read('service-worker.js')==(root/'public/service-worker.js').read_bytes()
print('Verified 66 public files, active release assets, script uniqueness, source bytes and immutable cache paths.')
